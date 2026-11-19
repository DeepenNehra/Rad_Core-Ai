"""
Structured Radiology Report Writer for MEDIVISTA AI.

Converts a list of AI findings into a clinician-readable radiology report
dict that matches the ``RadiologyReport`` Pydantic schema.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_MODALITY_SECTIONS: Dict[str, List[str]] = {
    "X-Ray":      ["Lungs", "Pleura", "Heart & Mediastinum", "Bones & Soft Tissues"],
    "CT":         ["Parenchyma", "Vasculature", "Mediastinum", "Abdomen"],
    "MRI":        ["Brain Parenchyma", "Extra-Axial Spaces", "Vasculature", "Spine"],
    "Ultrasound": ["Hepatobiliary", "Renal", "Vascular", "Soft Tissues"],
}

_MODALITY_EXAM_DESCRIPTIONS: Dict[str, str] = {
    "X-Ray":      "Chest radiograph, {view} projection",
    "CT":         "Computed tomography of the {region} {with_contrast}",
    "MRI":        "Magnetic resonance imaging of the {region} {with_contrast}",
    "Ultrasound": "Ultrasound examination of the {region}",
}

_MODALITY_TECHNIQUE: Dict[str, str] = {
    "X-Ray": (
        "Standard {view} chest projection performed with the patient in the "
        "{position} position. No prior comparison available unless noted."
    ),
    "CT": (
        "Multi-detector CT acquired with {slice_thickness} mm slice thickness "
        "{contrast_phrase}. Images reconstructed in soft-tissue and lung windows."
    ),
    "MRI": (
        "Multi-sequence MRI performed including T1W, T2W, FLAIR{contrast_phrase}. "
        "No significant motion artefact."
    ),
    "Ultrasound": (
        "Real-time B-mode ultrasound performed with a {frequency} MHz transducer. "
        "Colour Doppler applied where indicated."
    ),
}

_DISCLAIMER = (
    "IMPORTANT — AI ASSISTED REPORT: This report has been generated with the "
    "assistance of an artificial intelligence decision-support system. All findings "
    "and recommendations MUST be reviewed and validated by a qualified, licensed "
    "radiologist or appropriate clinical specialist before any clinical action is "
    "taken. This AI output does not constitute a final medical diagnosis."
)


# ---------------------------------------------------------------------------
# ReportGenerator
# ---------------------------------------------------------------------------


class ReportGenerator:
    """
    Converts structured AI findings into a formatted radiology report.

    Usage::

        rg = ReportGenerator()
        report_dict = rg.generate(
            findings=[...],
            ruled_out=["Pneumothorax"],
            modality="X-Ray",
            patient_info={"age": 45, "gender": "Male", "symptoms": "Cough"},
            metadata={"view": "PA", "position": "erect"},
        )
    """

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def generate(
        self,
        findings: List[dict],
        ruled_out: List[str],
        modality: str,
        patient_info: dict,
        metadata: dict,
    ) -> dict:
        """
        Build and return a report dict matching the ``RadiologyReport`` schema.

        Parameters
        ----------
        findings:
            List of finding dicts from the AI pipeline.
        ruled_out:
            Labels that were actively assessed and found absent.
        modality:
            Imaging modality string — "X-Ray", "CT", "MRI", or "Ultrasound".
        patient_info:
            Dict with keys like ``age``, ``gender``, ``symptoms``.
        metadata:
            Freeform dict with scanner/study metadata (view, contrast, etc.).

        Returns
        -------
        dict
            Keys: examination, technique, comparison, findings,
            impression, urgency_level, disclaimer.
        """
        # Sort findings: critical first, then by descending confidence
        sorted_findings = sorted(
            findings,
            key=lambda f: (not f.get("is_critical", False), -float(f.get("confidence", 0.0))),
        )

        return {
            "examination": self._get_examination_description(modality, metadata),
            "technique": self._get_technique_description(modality, metadata),
            "comparison": metadata.get("comparison", "No prior studies available for comparison."),
            "findings": self._build_findings_narrative(sorted_findings, ruled_out, modality),
            "impression": self._build_impression(sorted_findings, modality),
            "urgency_level": self._determine_urgency(sorted_findings),
            "disclaimer": _DISCLAIMER,
        }

    # ------------------------------------------------------------------
    # Urgency determination
    # ------------------------------------------------------------------

    def _determine_urgency(self, findings: List[dict]) -> str:
        """
        Return "URGENT", "INTERMEDIATE", or "ROUTINE".

        URGENT      — any finding flagged is_critical=True
        INTERMEDIATE— any high-confidence (>=0.80) finding with Severe/Moderate severity
        ROUTINE     — everything else
        """
        for f in findings:
            if f.get("is_critical", False):
                return "URGENT"

        for f in findings:
            if float(f.get("confidence", 0.0)) >= 0.80:
                severity = str(f.get("severity", "")).lower()
                if "severe" in severity or "moderate" in severity:
                    return "INTERMEDIATE"

        return "ROUTINE"

    # ------------------------------------------------------------------
    # Findings narrative
    # ------------------------------------------------------------------

    def _build_findings_narrative(
        self,
        findings: List[dict],
        ruled_out: List[str],
        modality: str,
    ) -> str:
        """
        Build a multi-paragraph findings narrative organised by anatomical section.
        """
        sections = _MODALITY_SECTIONS.get(modality, ["General Findings"])
        paragraphs: List[str] = []

        for section in sections:
            # Collect findings that belong to this anatomical section
            section_findings = self._assign_findings_to_section(findings, section, modality)

            if section_findings:
                lines = [f"{section}:"]
                for f in section_findings:
                    label = f.get("label", "Abnormality")
                    confidence = float(f.get("confidence", 0.0))
                    severity = f.get("severity", "")
                    description = f.get("description", "")
                    is_critical = f.get("is_critical", False)
                    location = f.get("location", "")

                    sentence = f"  — {label}"
                    if location:
                        sentence += f" in the {location}"
                    if severity:
                        sentence += f" ({severity})"
                    sentence += f", AI confidence {confidence * 100:.0f}%"
                    if description:
                        sentence += f". {description.rstrip('.')}."
                    if is_critical:
                        sentence += " *** CRITICAL FINDING — URGENT CLINICAL ATTENTION REQUIRED ***"
                    lines.append(sentence)

                paragraphs.append("\n".join(lines))
            else:
                paragraphs.append(f"{section}:\n  — No significant abnormality detected in this region.")

        # Ruled-out section
        if ruled_out:
            ruled_text = ", ".join(ruled_out)
            paragraphs.append(
                f"Actively Assessed and Excluded:\n"
                f"  — The following conditions were considered and not identified: {ruled_text}."
            )

        return "\n\n".join(paragraphs)

    # ------------------------------------------------------------------
    # Impression
    # ------------------------------------------------------------------

    def _build_impression(self, findings: List[dict], modality: str) -> str:
        """
        Return a numbered impression list (most critical finding first).
        """
        if not findings:
            return "1. No significant acute cardiopulmonary abnormality identified on this AI-assisted analysis."

        lines: List[str] = []
        for idx, f in enumerate(findings, start=1):
            label = f.get("label", "Abnormality")
            confidence = float(f.get("confidence", 0.0))
            severity = f.get("severity", "")
            is_critical = f.get("is_critical", False)
            location = f.get("location", "")

            impression = f"{idx}. {label}"
            if location:
                impression += f" — {location}"
            if severity:
                impression += f" ({severity})"
            impression += f" [Confidence: {confidence * 100:.0f}%]"
            if is_critical:
                impression += ". URGENT: Immediate clinical correlation required."

            lines.append(impression)

        # Closing statement
        lines.append(
            f"{len(lines) + 1}. Clinical correlation with patient history and symptoms is "
            "strongly recommended. This report is AI-assisted and requires radiologist validation."
        )
        return "\n".join(lines)

    # ------------------------------------------------------------------
    # Exam & technique descriptions
    # ------------------------------------------------------------------

    def _get_examination_description(self, modality: str, metadata: dict) -> str:
        """Return a modality-specific one-line exam description."""
        template = _MODALITY_EXAM_DESCRIPTIONS.get(
            modality,
            "Medical imaging study — {modality}",
        )

        contrast = metadata.get("contrast", False)
        with_contrast = "with IV contrast" if contrast else "without contrast"
        view = metadata.get("view", "PA")
        region = metadata.get("region", "chest")

        return template.format(
            view=view,
            region=region,
            with_contrast=with_contrast,
            modality=modality,
        )

    def _get_technique_description(self, modality: str, metadata: dict) -> str:
        """Return a modality-specific technique line."""
        template = _MODALITY_TECHNIQUE.get(
            modality,
            "Standard imaging technique applied for {modality}.",
        )

        contrast = metadata.get("contrast", False)
        view = metadata.get("view", "PA")
        position = metadata.get("position", "upright")
        slice_thickness = metadata.get("slice_thickness", 1.25)
        frequency = metadata.get("transducer_frequency", 3.5)

        if contrast:
            contrast_phrase_ct = "following IV administration of non-ionic contrast"
            contrast_phrase_mri = " and post-gadolinium sequences"
        else:
            contrast_phrase_ct = "without contrast administration"
            contrast_phrase_mri = ""

        return template.format(
            view=view,
            position=position,
            slice_thickness=slice_thickness,
            contrast_phrase=contrast_phrase_ct if modality == "CT" else contrast_phrase_mri,
            frequency=frequency,
            modality=modality,
        )

    # ------------------------------------------------------------------
    # Private section assignment
    # ------------------------------------------------------------------

    _SECTION_KEYWORD_MAP: Dict[str, List[str]] = {
        # X-Ray sections
        "Lungs": [
            "consolidation", "nodule", "mass", "pneumonia", "atelectasis",
            "emphysema", "fibrosis", "effusion", "pneumothorax", "lung",
            "pulmonary", "opacity", "infiltrate",
        ],
        "Pleura": ["pleural", "effusion", "thickening", "pneumothorax"],
        "Heart & Mediastinum": ["cardiomegaly", "mediastinum", "heart", "aorta", "hilum"],
        "Bones & Soft Tissues": ["rib", "fracture", "spine", "vertebra", "soft tissue", "bone"],
        # CT sections
        "Parenchyma": [
            "consolidation", "nodule", "mass", "ground glass", "fibrosis",
            "emphysema", "bronchiectasis", "lung", "pulmonary",
        ],
        "Vasculature": ["embolism", "pe", "aneurysm", "aorta", "vascular", "vessel"],
        "Mediastinum": ["mediastinum", "lymph node", "lymphadenopathy", "thymus"],
        "Abdomen": ["liver", "spleen", "kidney", "pancreas", "bowel", "adrenal", "abdomen"],
        # MRI sections
        "Brain Parenchyma": [
            "infarct", "stroke", "tumour", "tumor", "neoplasm", "glioma",
            "metastasis", "haemorrhage", "hemorrhage", "brain",
        ],
        "Extra-Axial Spaces": ["subdural", "epidural", "subarachnoid", "extra-axial"],
        "Vasculature": ["aneurysm", "avm", "vascular", "mra"],
        "Spine": ["disc", "herniation", "spinal", "cord", "vertebra"],
        # Ultrasound sections
        "Hepatobiliary": ["liver", "gallbladder", "bile", "hepatic", "cholecystitis"],
        "Renal": ["kidney", "renal", "hydronephrosis", "calculus"],
        "Vascular": ["aorta", "doppler", "thrombus", "dvt"],
        "Soft Tissues": ["soft tissue", "lymph node", "thyroid", "hernia"],
    }

    def _assign_findings_to_section(
        self,
        findings: List[dict],
        section: str,
        modality: str,
    ) -> List[dict]:
        """Return findings that best match an anatomical section."""
        keywords = self._SECTION_KEYWORD_MAP.get(section, [])
        matched: List[dict] = []
        for f in findings:
            label_lower = str(f.get("label", "")).lower()
            desc_lower = str(f.get("description", "")).lower()
            search_text = label_lower + " " + desc_lower
            if any(kw in search_text for kw in keywords):
                matched.append(f)
        return matched
