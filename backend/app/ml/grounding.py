"""
Spatial Localization & Heatmap Engine for MEDIVISTA AI.

Annotates medical images with bounding-box overlays and attention
heatmaps, then encodes results to base64 for JSON API transport.
"""

from __future__ import annotations

import base64
import io
import logging
from typing import List, Optional, Tuple

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Colour palette
# ---------------------------------------------------------------------------
_COLOUR_CRITICAL: Tuple[int, int, int] = (255, 50, 50)      # red   — critical
_COLOUR_HIGH_CONF: Tuple[int, int, int] = (255, 165, 0)     # orange — high confidence
_COLOUR_DEFAULT: Tuple[int, int, int] = (255, 220, 0)       # yellow — standard

_BOX_LINE_WIDTH = 3
_HEATMAP_ALPHA = 0.40   # 40 % opacity for heatmap overlay


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _get_finding_colour(finding: dict) -> Tuple[int, int, int]:
    """Return the annotation colour for a finding."""
    if finding.get("is_critical", False):
        return _COLOUR_CRITICAL
    if float(finding.get("confidence", 0.0)) >= 0.80:
        return _COLOUR_HIGH_CONF
    return _COLOUR_DEFAULT


def _get_bbox(finding: dict, img_width: int, img_height: int) -> Optional[Tuple[int, int, int, int]]:
    """
    Extract (x0, y0, x1, y1) pixel coordinates from a finding.

    Accepts both absolute pixel boxes and normalised [0,1] boxes.
    Returns None when no bounding-box information is present.
    """
    bbox = finding.get("bounding_box") or finding.get("bbox")
    if not bbox:
        return None

    # Support dict form {x, y, width, height} or {x0, y0, x1, y1}
    if isinstance(bbox, dict):
        if "width" in bbox:
            x0 = bbox.get("x", 0)
            y0 = bbox.get("y", 0)
            x1 = x0 + bbox.get("width", 0)
            y1 = y0 + bbox.get("height", 0)
        else:
            x0 = bbox.get("x0", bbox.get("x", 0))
            y0 = bbox.get("y0", bbox.get("y", 0))
            x1 = bbox.get("x1", x0 + bbox.get("width", 0))
            y1 = bbox.get("y1", y0 + bbox.get("height", 0))
    elif isinstance(bbox, (list, tuple)) and len(bbox) == 4:
        x0, y0, x1, y1 = bbox
    else:
        return None

    # Normalise fractional coordinates → pixels
    if all(0.0 <= v <= 1.0 for v in (x0, y0, x1, y1)):
        x0 = int(x0 * img_width)
        y0 = int(y0 * img_height)
        x1 = int(x1 * img_width)
        y1 = int(y1 * img_height)
    else:
        x0, y0, x1, y1 = int(x0), int(y0), int(x1), int(y1)

    # Clamp
    x0 = max(0, min(x0, img_width - 1))
    y0 = max(0, min(y0, img_height - 1))
    x1 = max(x0 + 1, min(x1, img_width))
    y1 = max(y0 + 1, min(y1, img_height))

    return x0, y0, x1, y1


def _try_load_font(size: int = 14) -> ImageFont.ImageFont:
    """Return a truetype font if available, else the default bitmap font."""
    try:
        return ImageFont.truetype("arial.ttf", size)
    except OSError:
        try:
            return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", size)
        except OSError:
            return ImageFont.load_default()


# ---------------------------------------------------------------------------
# Public functions
# ---------------------------------------------------------------------------


def draw_bounding_boxes(pil_img: Image.Image, findings: List[dict]) -> Image.Image:
    """
    Draw colour-coded bounding boxes and labels on *pil_img*.

    The image is first converted to RGB so that colour drawing works
    regardless of the source mode (L, RGBA, …).

    Parameters
    ----------
    pil_img:
        Source medical image.
    findings:
        List of finding dicts.  Each may optionally carry a
        ``bounding_box`` / ``bbox`` key; findings without one are skipped.

    Returns
    -------
    Image.Image
        A new RGB image with annotations drawn on it.
    """
    annotated = pil_img.convert("RGB").copy()
    draw = ImageDraw.Draw(annotated)
    font = _try_load_font(14)
    w, h = annotated.size

    drawn = 0
    for finding in findings:
        coords = _get_bbox(finding, w, h)
        if coords is None:
            continue

        x0, y0, x1, y1 = coords
        colour = _get_finding_colour(finding)

        # Draw rectangle (thick border via multiple offset rectangles)
        for offset in range(_BOX_LINE_WIDTH):
            draw.rectangle(
                [x0 - offset, y0 - offset, x1 + offset, y1 + offset],
                outline=colour,
            )

        # Build label text
        label_text = finding.get("label", "Finding")
        confidence = float(finding.get("confidence", 0.0))
        display_text = f"{label_text} {confidence * 100:.0f}%"

        # Draw label background chip
        try:
            # Pillow >= 10.0 uses textbbox
            bbox_text = draw.textbbox((x0, y0 - 20), display_text, font=font)
            text_w = bbox_text[2] - bbox_text[0]
            text_h = bbox_text[3] - bbox_text[1]
        except AttributeError:
            text_w, text_h = draw.textsize(display_text, font=font)  # type: ignore[attr-defined]

        chip_y0 = max(0, y0 - text_h - 6)
        chip_y1 = chip_y0 + text_h + 4
        draw.rectangle([x0, chip_y0, x0 + text_w + 6, chip_y1], fill=colour)
        draw.text((x0 + 3, chip_y0 + 2), display_text, fill=(255, 255, 255), font=font)

        drawn += 1

    logger.debug("Drew %d bounding boxes on image (%dx%d).", drawn, w, h)
    return annotated


def generate_attention_heatmap(pil_img: Image.Image, findings: List[dict]) -> Image.Image:
    """
    Generate a semi-transparent Gaussian-blurred heatmap overlay.

    For each finding that carries a bounding box, a solid colour patch is
    painted on a blank RGBA canvas and then blurred.  The final heatmap is
    composited over the original image at ``_HEATMAP_ALPHA`` opacity.

    Parameters
    ----------
    pil_img:
        Source medical image.
    findings:
        List of finding dicts.

    Returns
    -------
    Image.Image
        RGB composite (original + heatmap).
    """
    base = pil_img.convert("RGBA")
    w, h = base.size

    # Blank RGBA overlay
    heatmap_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    heatmap_draw = ImageDraw.Draw(heatmap_layer)

    any_drawn = False
    for finding in findings:
        coords = _get_bbox(finding, w, h)
        if coords is None:
            continue

        x0, y0, x1, y1 = coords
        colour = _get_finding_colour(finding)
        # Paint filled rectangle on heatmap layer with moderate opacity
        heatmap_draw.rectangle([x0, y0, x1, y1], fill=(*colour, 180))
        any_drawn = True

    if any_drawn:
        # Gaussian blur spreads the colour into a smooth heatmap
        heatmap_layer = heatmap_layer.filter(ImageFilter.GaussianBlur(radius=18))

    # Composite: heatmap_layer at _HEATMAP_ALPHA on top of base
    alpha_channel = heatmap_layer.getchannel("A")
    # Scale the existing alpha by the global overlay alpha
    alpha_array = np.array(alpha_channel, dtype=np.float32) * _HEATMAP_ALPHA
    alpha_channel_scaled = Image.fromarray(alpha_array.astype(np.uint8))
    heatmap_layer.putalpha(alpha_channel_scaled)

    composite = Image.alpha_composite(base, heatmap_layer)
    return composite.convert("RGB")


def encode_image_to_base64(pil_img: Image.Image) -> str:
    """
    Encode a PIL image as a base64 PNG string for JSON transport.

    Parameters
    ----------
    pil_img:
        Any PIL image.

    Returns
    -------
    str
        Base64-encoded PNG bytes (no ``data:image/png;base64,`` prefix).
    """
    buffer = io.BytesIO()
    pil_img.convert("RGB").save(buffer, format="PNG", optimize=True)
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode("utf-8")


def run_grounding(pil_img: Image.Image, findings: List[dict]) -> dict:
    """
    Full grounding pipeline: annotate + heatmap + base64 encode.

    Findings that do not carry bounding-box information are counted but
    skipped for spatial annotation — the pipeline never raises on missing
    keys.

    Parameters
    ----------
    pil_img:
        Source medical image.
    findings:
        List of finding dicts from the ML model.

    Returns
    -------
    dict
        ``annotated_image_b64``, ``heatmap_image_b64``,
        ``grounded_findings_count`` (int — findings with bounding boxes).
    """
    w, h = pil_img.size

    # Count how many findings actually have spatial information
    grounded_count = sum(
        1 for f in findings if _get_bbox(f, w, h) is not None
    )

    # Annotated image
    try:
        annotated = draw_bounding_boxes(pil_img, findings)
    except Exception as exc:
        logger.warning("draw_bounding_boxes failed: %s — returning original.", exc)
        annotated = pil_img.convert("RGB")

    # Heatmap image
    try:
        heatmap = generate_attention_heatmap(pil_img, findings)
    except Exception as exc:
        logger.warning("generate_attention_heatmap failed: %s — returning original.", exc)
        heatmap = pil_img.convert("RGB")

    return {
        "annotated_image_b64": encode_image_to_base64(annotated),
        "heatmap_image_b64": encode_image_to_base64(heatmap),
        "grounded_findings_count": grounded_count,
    }
