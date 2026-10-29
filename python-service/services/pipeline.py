
"""Combine LipiOCR image predictions with rule-based OCR text analysis."""

from .classifier import classify
from .extractor import extract_fields


# All 41 labels exposed by the configured LipiOCR model.
# Values use the existing DocuFlow documentType/category convention.
IMAGE_LABEL_MAP = {
    "aadhaar_card": ("Aadhaar", "Identity"),
    "airway_bill": ("Airway Bill", "Other"),
    "bank_cheque": ("Bank Cheque", "Financial"),
    "bank_statement": ("Bank Document", "Financial"),
    "birth_certificate": ("Birth Certificate", "Other"),
    "boarding_pass": ("Boarding Pass", "Other"),
    "business_card": ("Business Card", "Other"),
    "certificate": ("Certificate", "Education"),
    "cid": ("CID", "Identity"),
    "courier_waybill": ("Courier Waybill", "Other"),
    "credit_card": ("Credit Card", "Financial"),
    "driving_license": ("Driving Licence", "Identity"),
    "employment_offer_letter": ("Contract", "Legal"),
    "general_letter": ("General Letter", "Other"),
    "income_tax_return": ("Tax Document", "Financial"),
    "insurance_policy": ("Insurance Policy", "Insurance"),
    "invoice": ("Invoice", "Financial"),
    "marksheet": ("Marksheet", "Education"),
    "marriage_certificate": ("Marriage Certificate", "Other"),
    "medical_certificate": ("Medical Certificate", "Other"),
    "medical_prescription": ("Medical Prescription", "Other"),
    "menu_card": ("Menu Card", "Other"),
    "nic": ("National Identity Card", "Identity"),
    "noc": ("No Objection Certificate", "Legal"),
    "pan_card": ("PAN", "Identity"),
    "passport": ("Passport", "Identity"),
    "payment_voucher": ("Payment Voucher", "Financial"),
    "pos_payment_slip": ("POS Payment Slip", "Financial"),
    "product_catalog": ("Product Catalog", "Other"),
    "purchase_order": ("Purchase Order", "Financial"),
    "quotation": ("Quotation", "Financial"),
    "receipt": ("Receipt", "Financial"),
    "reference_letter": ("Reference Letter", "Other"),
    "rental_agreement": ("Agreement", "Legal"),
    "resume": ("Resume", "Other"),
    "salary_slip": ("Salary Slip", "Financial"),
    "telegraphic_transfer": ("Telegraphic Transfer", "Financial"),
    "utility_bill": ("Utility Bill", "Financial"),
    "vaccination_certificate": ("Vaccination Certificate", "Other"),
    "vehicle_registration": ("Vehicle Registration", "Identity"),
    "visa": ("Visa", "Identity"),
    "voter_id": ("Voter ID", "Identity"),

    # Compatibility aliases for older labels or alternate spellings.
    "aadhar_card": ("Aadhaar", "Identity"),
    "driving_licence": ("Driving Licence", "Identity"),
    "health_insurance": ("Health Insurance", "Insurance"),
    "vehicle_insurance": ("Vehicle Insurance", "Insurance"),
    "life_insurance": ("Life Insurance", "Insurance"),
    "tax_document": ("Tax Document", "Financial"),
}

# These values are heuristic thresholds, not measured accuracy guarantees.
IMAGE_MIN_CONFIDENCE = 75.0
OCR_STRONG_CONFIDENCE = 0.45


def _valid_confidence(value):
    """Return a finite confidence percentage, or zero for invalid input."""
    try:
        number = float(value)
    except (TypeError, ValueError):
        return 0.0

    if not 0.0 <= number <= 100.0:
        return 0.0

    return number


def analyse(text, image_prediction=None):
    """Combine OCR text classification and image classification."""

    text_result = classify(text)
    result = dict(text_result)

    image_info = None

    if isinstance(image_prediction, dict):
        label = str(image_prediction.get("label", "")).strip().lower()
        image_confidence = _valid_confidence(
            image_prediction.get("confidence", 0)
        )
        mapped = IMAGE_LABEL_MAP.get(label)

        if mapped and image_confidence >= IMAGE_MIN_CONFIDENCE:
            image_type, image_category = mapped

            text_type = text_result.get("documentType", "Other Document")
            text_category = text_result.get("category", "Other")
            text_confidence = _valid_confidence(
                float(text_result.get("confidence", 0)) * 100
            ) / 100

            # Preserve specific OCR results when text evidence is strong.
            # The existing rule-based confidence is heuristic, so this is
            # a conservative compatibility rule rather than a probability.
            if (
                text_type != "Other Document"
                and text_category != "Other"
                and text_confidence >= OCR_STRONG_CONFIDENCE
            ):
                result["method"] = "lipiocr-image+rule-based-text"
            else:
                result["documentType"] = image_type
                result["category"] = image_category
                result["confidence"] = round(image_confidence / 100, 4)
                result["method"] = "lipiocr-image"

            image_info = {
                "label": label,
                "confidence": image_confidence,
                "inferenceTimeMs": image_prediction.get("inferenceTimeMs"),
            }

    if image_info is not None:
        result["imagePrediction"] = image_info

    fields = extract_fields(text, result["documentType"])
    return {**result, **fields}
