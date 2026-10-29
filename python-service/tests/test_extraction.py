import io
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from services.pipeline import analyse  # noqa: E402


class ExtractionTests(unittest.TestCase):
    def test_driving_licence(self):
        text = ("Driving Licence\nUnion of India\nDL No: MH12 20190004521\nName: Rahul Sharma\n"
                "Date of Issue 19/07/2019\nValidity(NT) 12/08/2030\nCOV LMV MCWG\nRTO Pune")
        r = analyse(text)
        self.assertEqual(r["documentType"], "Driving Licence")
        self.assertEqual(r["category"], "Identity")
        self.assertEqual(r["expiryDate"], "2030-08-12")
        self.assertEqual(r["issueDate"], "2019-07-19")
        self.assertEqual(r["holderName"], "Rahul Sharma")
        self.assertEqual(r["documentNumber"], "MH12 20190004521")

    def test_spec_example(self):
        r = analyse("Driving Licence ... Valid Till: 12/08/2030")
        self.assertEqual(r["documentType"], "Driving Licence")
        self.assertEqual(r["expiryDate"], "2030-08-12")

    def test_pan(self):
        text = "INCOME TAX DEPARTMENT\nPermanent Account Number Card\nABCDE1234F\nName\nRAHUL SHARMA\nFather's Name\nSURESH SHARMA"
        r = analyse(text)
        self.assertEqual(r["documentType"], "PAN")
        self.assertEqual(r["documentNumber"], "ABCDE1234F")
        self.assertEqual(r["holderName"], "Rahul Sharma")
        self.assertIsNone(r["expiryDate"])

    def test_passport(self):
        text = "REPUBLIC OF INDIA\nPassport\nSurname Sharma\nGiven Names Rahul\nNationality INDIAN\nPassport No: P1234567\nDate of Issue 10/05/2019\nDate of Expiry 09/05/2029"
        r = analyse(text)
        self.assertEqual(r["documentType"], "Passport")
        self.assertEqual(r["expiryDate"], "2029-05-09")
        self.assertEqual(r["documentNumber"], "P1234567")

    def test_health_insurance_period(self):
        text = ("Star Health Insurance\nPolicy No: P/12345/2025\nName of Insured: Rahul Sharma\n"
                "Sum Insured Rs. 5,00,000\nCashless hospitalisation\n"
                "Period of Insurance: 01/04/2025 to 31/03/2026\nPremium paid")
        r = analyse(text)
        self.assertEqual(r["documentType"], "Health Insurance")
        self.assertEqual(r["issueDate"], "2025-04-01")
        self.assertEqual(r["expiryDate"], "2026-03-31")

    def test_textual_dates(self):
        r = analyse("Rental Agreement\nThis Agreement made between lessor and lessee\nValid until 1st November 2026")
        self.assertEqual(r["category"], "Legal")
        self.assertEqual(r["expiryDate"], "2026-11-01")

    def test_unknown(self):
        r = analyse("Grocery list: milk, eggs, bread")
        self.assertEqual(r["documentType"], "Other Document")
        self.assertEqual(r["category"], "Other")
        self.assertIsNone(r["expiryDate"])

    def test_invalid_date_ignored(self):
        r = analyse("Driving Licence\nValid Till: 45/13/2030")
        self.assertIsNone(r["expiryDate"])


class OcrIntegrationTest(unittest.TestCase):
    def test_real_tesseract_roundtrip(self):
        from PIL import Image, ImageDraw, ImageFont
        from services.ocr_service import run_ocr
        try:
            font = ImageFont.truetype("DejaVuSans.ttf", 34)
        except OSError:
            font = ImageFont.load_default(size=34)
        img = Image.new("RGB", (1100, 420), "white")
        d = ImageDraw.Draw(img)
        for i, line in enumerate(["Driving Licence", "Name: Rahul Sharma", "Valid Till: 12/08/2030"]):
            d.text((40, 40 + i * 90), line, fill="black", font=font)
        buf = io.BytesIO()
        img.save(buf, "PNG")
        res = run_ocr(buf.getvalue(), "image/png", "t.png")
        out = analyse(res["text"])
        self.assertEqual(out["documentType"], "Driving Licence")
        self.assertEqual(out["expiryDate"], "2030-08-12")


if __name__ == "__main__":
    unittest.main()
