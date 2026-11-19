"""
Epistemic Uncertainty Safety Gate for MEDIVISTA AI.

Classifies AI findings by confidence level and applies an abstention
policy so that low-confidence outputs never reach a clinician unfiltered.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import List, Tuple

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Optional config import — fall back to hardcoded defaults if unavailable
# ---------------------------------------------------------------------------
try:
    from backend.app.core.config import settings  # type: ignore

    _HIGH_CONF_DEFAULT: float = getattr(settings, "UNCERTAINTY_HIGH_CONFIDENCE_THRESHOLD", 0.80)
    _MOD_CONF_DEFAULT: float = getattr(settings, "UNCERTAINTY_MODERATE_CONFIDENCE_THRESHOLD", 0.60)
    _ABSTAIN_DEFAULT: float = getattr(settings, "UNCERTAINTY_ABSTENTION_THRESHOLD", 0.50)
except Exception:  # pragma: no cover
    _HIGH_CONF_DEFAULT = 0.80
    _MOD_CONF_DEFAULT = 0.60
    _ABSTAIN_DEFAULT = 0.50


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------


class UncertaintyLevel(str, Enum):
    """Clinically meaningful confidence tiers."""

    HIGH_CONFIDENCE = "HIGH_CONFIDENCE"       # >= 0.80  — safe to present
    REVIEW_REQUIRED = "REVIEW_REQUIRED"       # 0.60–0.79 — present with caveat
    LOW_CONFIDENCE = "LOW_CONFIDENCE"         # 0.50–0.59 — flag prominently
    ABSTAIN = "ABSTAIN"                       # < 0.50   — withheld from report


# ---------------------------------------------------------------------------
# Data-classes
# ---------------------------------------------------------------------------


@dataclass
class UncertaintyResult:
    """Full uncertainty assessment for a single AI finding."""

    finding_id: str
    label: str
    confidence: float
    uncertainty_score: float
    level: UncertaintyLevel
    is_abstained: bool
    calibration_note: str

    def to_dict(self) -> dict:
        return {
            "finding_id": self.finding_id,
            "label": self.label,
            "confidence": round(self.confidence, 4),
            "uncertainty_score": round(self.uncertainty_score, 4),
            "level": self.level.value,
            "is_abstained": self.is_abstained,
            "calibration_note": self.calibration_note,
        }


# ---------------------------------------------------------------------------
# Main gate class
# ---------------------------------------------------------------------------


class EpistemicUncertaintyGate:
    """
    Applies an uncertainty-aware filter to raw model findings.

    Parameters
    ----------
    confidence_threshold_high:
        Minimum confidence to classify as HIGH_CONFIDENCE.
    confidence_threshold_moderate:
        Minimum confidence to classify as REVIEW_REQUIRED.
    abstention_threshold:
        Below this confidence the finding is withheld (ABSTAIN).
    """

    def __init__(
        self,
        confidence_threshold_high: float = _HIGH_CONF_DEFAULT,
        confidence_threshold_moderate: float = _MOD_CONF_DEFAULT,
        abstention_threshold: float = _ABSTAIN_DEFAULT,
    ) -> None:
        self.confidence_threshold_high = confidence_threshold_high
        self.confidence_threshold_moderate = confidence_threshold_moderate
        self.abstention_threshold = abstention_threshold

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def assess_finding(self, finding: dict) -> UncertaintyResult:
        """
        Evaluate a single finding dict.

        Expected keys: ``id``, ``label``, ``confidence``, ``uncertainty``.
        Missing keys are tolerated with safe defaults.
        """
        finding_id: str = str(finding.get("id", "unknown"))
        label: str = str(finding.get("label", "Unknown Finding"))
        confidence: float = float(finding.get("confidence", 0.0))
        uncertainty_score: float = float(finding.get("uncertainty", 1.0 - confidence))

        # Clamp to [0, 1]
        confidence = max(0.0, min(1.0, confidence))
        uncertainty_score = max(0.0, min(1.0, uncertainty_score))

        level, is_abstained, calibration_note = self._classify(confidence, uncertainty_score)

        return UncertaintyResult(
            finding_id=finding_id,
            label=label,
            confidence=confidence,
            uncertainty_score=uncertainty_score,
            level=level,
            is_abstained=is_abstained,
            calibration_note=calibration_note,
        )

    def filter_findings(
        self,
        findings: List[dict],
    ) -> Tuple[List[dict], List[UncertaintyResult], List[str]]:
        """
        Partition findings into those that pass the gate and those abstained.

        Returns
        -------
        passed_findings:
            Findings whose confidence is above the abstention threshold.
        uncertainty_results:
            UncertaintyResult for every finding (including abstained ones).
        abstained_labels:
            Human-readable labels of withheld findings.
        """
        passed_findings: List[dict] = []
        uncertainty_results: List[UncertaintyResult] = []
        abstained_labels: List[str] = []

        for finding in findings:
            result = self.assess_finding(finding)
            uncertainty_results.append(result)

            if result.is_abstained:
                abstained_labels.append(result.label)
                logger.info(
                    "Abstained finding '%s' (id=%s, confidence=%.2f)",
                    result.label,
                    result.finding_id,
                    result.confidence,
                )
            else:
                passed_findings.append(finding)

        return passed_findings, uncertainty_results, abstained_labels

    def get_overall_uncertainty_summary(self, results: List[UncertaintyResult]) -> dict:
        """
        Aggregate statistics across all assessed findings.

        Returns a dict suitable for embedding in an API response.
        """
        if not results:
            return {
                "total_findings_assessed": 0,
                "passed": 0,
                "abstained": 0,
                "abstention_rate": 0.0,
                "mean_confidence": None,
                "mean_uncertainty_score": None,
                "level_distribution": {lvl.value: 0 for lvl in UncertaintyLevel},
                "overall_quality": "NO_DATA",
            }

        total = len(results)
        abstained = sum(1 for r in results if r.is_abstained)
        passed = total - abstained

        mean_confidence = sum(r.confidence for r in results) / total
        mean_uncertainty = sum(r.uncertainty_score for r in results) / total

        level_dist: dict = {lvl.value: 0 for lvl in UncertaintyLevel}
        for r in results:
            level_dist[r.level.value] += 1

        # Derive an overall quality label
        if abstained / total > 0.5:
            overall_quality = "POOR"
        elif mean_confidence >= self.confidence_threshold_high:
            overall_quality = "GOOD"
        elif mean_confidence >= self.confidence_threshold_moderate:
            overall_quality = "ACCEPTABLE"
        else:
            overall_quality = "MARGINAL"

        return {
            "total_findings_assessed": total,
            "passed": passed,
            "abstained": abstained,
            "abstention_rate": round(abstained / total, 4),
            "mean_confidence": round(mean_confidence, 4),
            "mean_uncertainty_score": round(mean_uncertainty, 4),
            "level_distribution": level_dist,
            "overall_quality": overall_quality,
        }

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _classify(
        self, confidence: float, uncertainty_score: float
    ) -> Tuple[UncertaintyLevel, bool, str]:
        """Return (level, is_abstained, calibration_note) for a finding."""

        if confidence < self.abstention_threshold:
            return (
                UncertaintyLevel.ABSTAIN,
                True,
                (
                    f"Confidence {confidence:.0%} is below the abstention threshold "
                    f"({self.abstention_threshold:.0%}). Finding withheld from report."
                ),
            )

        if confidence < self.confidence_threshold_moderate:
            return (
                UncertaintyLevel.LOW_CONFIDENCE,
                False,
                (
                    f"Confidence {confidence:.0%} is in the low-confidence band "
                    f"({self.abstention_threshold:.0%}–{self.confidence_threshold_moderate:.0%}). "
                    "Physician review strongly recommended."
                ),
            )

        if confidence < self.confidence_threshold_high:
            return (
                UncertaintyLevel.REVIEW_REQUIRED,
                False,
                (
                    f"Confidence {confidence:.0%} is in the moderate band "
                    f"({self.confidence_threshold_moderate:.0%}–{self.confidence_threshold_high:.0%}). "
                    "Review recommended before clinical action."
                ),
            )

        # >= high threshold
        note = f"Confidence {confidence:.0%} meets high-confidence threshold ({self.confidence_threshold_high:.0%})."
        if uncertainty_score > 0.25:
            note += f" Epistemic uncertainty ({uncertainty_score:.2f}) is elevated; consider ensemble verification."
        return UncertaintyLevel.HIGH_CONFIDENCE, False, note
