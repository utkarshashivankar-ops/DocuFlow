
import unittest

from services.pipeline import IMAGE_LABEL_MAP, analyse


class TestImageLabelMap(unittest.TestCase):

    def test_supported_identity_labels(self):
        expected = {
            "aadhaar_card": ("Aadhaar", "Identity"),
            "pan_card": ("PAN", "Identity"),
            "passport": ("Passport", "Identity"),
            "driving_license": ("Driving Licence", "Identity"),
            "voter_id": ("Voter ID", "Identity"),
        }

        for label, result in expected.items():
            with self.subTest(label=label):
                self.assertEqual(IMAGE_LABEL_MAP.get(label), result)

    def test_all_model_labels_have_mappings(self):
        model_labels = [
            "aadhaar_card", "airway_bill", "bank_cheque",
            "bank_statement", "birth_certificate", "boarding_pass",
            "business_card", "certificate", "cid", "courier_waybill",
            "credit_card", "driving_license", "employment_offer_letter",
            "general_letter", "income_tax_return", "insurance_policy",
            "invoice", "marksheet", "marriage_certificate",
            "medical_certificate", "medical_prescription", "menu_card",
            "nic", "noc", "pan_card", "passport", "payment_voucher",
            "pos_payment_slip", "product_catalog", "purchase_order",
            "quotation", "receipt", "reference_letter", "rental_agreement",
            "resume", "salary_slip", "telegraphic_transfer", "utility_bill",
            "vaccination_certificate", "vehicle_registration", "visa",
            "voter_id",
        ]

        missing = [
            label for label in model_labels
            if label not in IMAGE_LABEL_MAP
        ]

        self.assertEqual(
            missing, [],
            f"Model labels without mappings: {missing}"
        )

    def test_tax_return_label_mapping(self):
        self.assertEqual(
            IMAGE_LABEL_MAP.get("income_tax_return"),
            ("Tax Document", "Financial"),
        )

    def test_certificate_label_mappings(self):
        expected = {
            "birth_certificate": ("Birth Certificate", "Other"),
            "marriage_certificate": ("Marriage Certificate", "Other"),
            "medical_certificate": ("Medical Certificate", "Other"),
        }

        for label, result in expected.items():
            with self.subTest(label=label):
                self.assertEqual(IMAGE_LABEL_MAP.get(label), result)


class TestAnalyse(unittest.TestCase):

    def test_unknown_image_label_does_not_crash(self):
        result = analyse(
            "This document contains no identifying information.",
            image_prediction={
                "label": "unknown_document_type",
                "confidence": 99.0,
            },
        )

        for field in (
            "documentType", "category", "confidence",
            "method", "scores",
        ):
            self.assertIn(field, result)

    def test_strong_pan_text_remains_pan(self):
        result = analyse(
            "INCOME TAX DEPARTMENT PERMANENT ACCOUNT NUMBER ABCDE1234F",
            image_prediction={
                "label": "pan_card",
                "confidence": 95.0,
            },
        )

        self.assertEqual(result["documentType"], "PAN")
        self.assertEqual(result["category"], "Identity")

    def test_result_contains_extracted_fields(self):
        result = analyse(
            "Date of Birth: 12/05/2005",
            image_prediction=None,
        )

        for field in (
            "holderName", "documentNumber", "issueDate",
            "expiryDate", "importantDates",
        ):
            self.assertIn(field, result)


if __name__ == "__main__":
    unittest.main()
