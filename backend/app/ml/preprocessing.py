import io
import re
import numpy as np
from PIL import Image
from typing import Tuple, Dict, Any, Optional

try:
    import pydicom
    HAS_PYDICOM = True
except ImportError:
    HAS_PYDICOM = False

def extract_dicom_metadata(dcm: Any) -> Dict[str, Any]:
    """
    Extracts clinical patient metadata and technical exposure parameters
    from a DICOM dataset (PRD Section 10.2 & Section 13.2).
    """
    meta: Dict[str, Any] = {
        "patient_id": getattr(dcm, "PatientID", "PT-UNKNOWN"),
        "patient_name": str(getattr(dcm, "PatientName", "ANONYMOUS")),
        "gender": getattr(dcm, "PatientSex", "Unknown"),
        "modality": getattr(dcm, "Modality", "CR"),
        "study_date": getattr(dcm, "StudyDate", ""),
        "photometric_interpretation": getattr(dcm, "PhotometricInterpretation", "MONOCHROME2"),
        "kvp": getattr(dcm, "KVP", 120.0),
        "tube_current_ma": getattr(dcm, "XRayTubeCurrent", 320.0),
        "exposure_time_ms": getattr(dcm, "ExposureTime", 4.0),
    }

    # Extract Age (DICOM PatientAge format is usually '051Y' or '51')
    raw_age = getattr(dcm, "PatientAge", None)
    if raw_age:
        age_match = re.search(r"\d+", str(raw_age))
        if age_match:
            meta["age"] = int(age_match.group())
    else:
        meta["age"] = None

    return meta

def load_and_preprocess_image(
    file_bytes: bytes,
    filename: str
) -> Tuple[np.ndarray, Image.Image, Dict[str, Any]]:
    """
    Master Ingestion & Preprocessing function.
    Handles standard images (.png, .jpg) and medical DICOM files (.dcm).
    
    Returns:
        1. normalized_array: np.ndarray (float32, [0.0, 1.0]) for model input.
        2. pil_image: PIL.Image in RGB format for browser workstation rendering.
        3. metadata: Extracted patient and technical metadata dictionary.
    """
    metadata: Dict[str, Any] = {
        "filename": filename,
        "format": "UNKNOWN",
        "original_size": (0, 0),
        "is_dicom": False,
        "patient_id": "PT-UNKNOWN",
        "age": None,
        "gender": "Unknown",
        "photometric_interpretation": "MONOCHROME2"
    }

    # 1. Attempt DICOM Ingestion
    is_dcm_ext = filename.lower().endswith((".dcm", ".dicom"))
    if HAS_PYDICOM and is_dcm_ext:
        try:
            dcm = pydicom.dcmread(io.BytesIO(file_bytes), force=True)
            if hasattr(dcm, "pixel_array"):
                pixel_array = dcm.pixel_array.astype(np.float32)
                
                # Extract clinical metadata from DICOM headers
                dcm_meta = extract_dicom_metadata(dcm)
                metadata.update(dcm_meta)
                metadata["is_dicom"] = True
                metadata["format"] = "DICOM"
                metadata["original_size"] = (int(pixel_array.shape[1]), int(pixel_array.shape[0]))

                # Apply Rescale Slope & Intercept if present (DICOM standard)
                slope = float(getattr(dcm, "RescaleSlope", 1.0))
                intercept = float(getattr(dcm, "RescaleIntercept", 0.0))
                if slope != 1.0 or intercept != 0.0:
                    pixel_array = pixel_array * slope + intercept

                # Handle MONOCHROME1 (Inverted X-ray: zero is white, max is black)
                # Convert to standard MONOCHROME2 (zero is black, max is white)
                if metadata["photometric_interpretation"] == "MONOCHROME1":
                    pixel_array = np.amax(pixel_array) - pixel_array
                    metadata["photometric_interpretation"] = "MONOCHROME2 (Corrected)"

                # Contrast Stretching to standard 8-bit [0, 255]
                min_val = np.amin(pixel_array)
                max_val = np.amax(pixel_array)
                if max_val > min_val:
                    norm_255 = ((pixel_array - min_val) / (max_val - min_val) * 255.0).astype(np.uint8)
                else:
                    norm_255 = np.zeros_like(pixel_array, dtype=np.uint8)

                pil_img = Image.fromarray(norm_255).convert("RGB")
                norm_array = (norm_255.astype(np.float32) / 255.0)
                return norm_array, pil_img, metadata

        except Exception as e:
            metadata["dicom_error"] = str(e)

    # 2. Standard Raster Image Ingestion (.png, .jpg, .jpeg)
    pil_img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    width, height = pil_img.size
    metadata["format"] = pil_img.format or "PNG/JPEG"
    metadata["original_size"] = (width, height)
    metadata["is_dicom"] = False

    # Convert to grayscale float array normalized to [0.0, 1.0]
    gray_img = pil_img.convert("L")
    norm_array = np.array(gray_img, dtype=np.float32) / 255.0

    return norm_array, pil_img, metadata
