
"""Real OCR using Tesseract (via pytesseract). PDFs are handled with PyMuPDF."""

import io
import os

import pytesseract
from PIL import Image, ImageOps


# Permanent Tesseract configuration for Windows.
DEFAULT_TESSERACT_CMD = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)


class OcrError(Exception):
    """Raised when OCR cannot be completed."""


def configure_tesseract():
    """Configure and verify the Tesseract executable."""

    configured_cmd = os.getenv("TESSERACT_CMD", "").strip().strip('"')

    # Use the environment setting only if it points to a real file.
    if not configured_cmd or not os.path.isfile(configured_cmd):
        configured_cmd = DEFAULT_TESSERACT_CMD

    if not os.path.isfile(configured_cmd):
        raise OcrError(
            "Tesseract executable not found. Checked: "
            + configured_cmd
            + ". Install Tesseract or correct DEFAULT_TESSERACT_CMD."
        )

    # Always assign the executable explicitly.
    pytesseract.pytesseract.tesseract_cmd = configured_cmd


LANG = os.getenv("TESSERACT_LANG", "eng")
MAX_PDF_PAGES = int(os.getenv("MAX_PDF_PAGES", "5"))
TESS_CONFIG = "--oem 3 --psm 3"


def _preprocess(img):
    """Prepare an image for OCR."""
    img = ImageOps.exif_transpose(img)
    img = img.convert("L")

    if min(img.size) < 1000:
        scale = 2 if min(img.size) >= 500 else 3
        img = img.resize(
            (img.width * scale, img.height * scale),
            Image.LANCZOS,
        )

    return ImageOps.autocontrast(img)


def ocr_image(data):
    """Extract text from image bytes using Tesseract."""

    try:
        img = Image.open(io.BytesIO(data))
        img.load()
        img = _preprocess(img)
    except Exception as exc:
        raise OcrError("The image could not be read.") from exc

    try:
        configure_tesseract()

        d = pytesseract.image_to_data(
            img,
            lang=LANG,
            config=TESS_CONFIG,
            output_type=pytesseract.Output.DICT,
        )

    except pytesseract.TesseractNotFoundError as exc:
        raise OcrError(
            "Tesseract executable could not be launched. "
            f"Configured path: {pytesseract.pytesseract.tesseract_cmd}"
        ) from exc

    except OcrError:
        raise

    except Exception as exc:
        raise OcrError(f"Tesseract failed: {exc}") from exc

    lines = {}
    order = []
    confs = []

    for i, word in enumerate(d["text"]):
        word = (word or "").strip()

        if not word:
            continue

        key = (
            d["block_num"][i],
            d["par_num"][i],
            d["line_num"][i],
        )

        if key not in lines:
            lines[key] = []
            order.append(key)

        lines[key].append(word)

        try:
            confidence_value = float(d["conf"][i])
            if confidence_value >= 0:
                confs.append(confidence_value)
        except (ValueError, TypeError):
            pass

    text = "\n".join(" ".join(lines[key]) for key in order)

    confidence = (
        round(sum(confs) / len(confs), 1)
        if confs
        else 0.0
    )

    return {
        "text": text,
        "confidence": confidence,
        "pages": 1,
    }


def ocr_pdf(data):
    """Extract text from digital or scanned PDFs."""

    try:
        import fitz  # PyMuPDF
    except ImportError as exc:
        raise OcrError(
            "PDF support requires PyMuPDF. "
            "Install it using: python -m pip install PyMuPDF"
        ) from exc

    try:
        pdf = fitz.open(stream=data, filetype="pdf")
    except Exception as exc:
        raise OcrError("The PDF could not be opened.") from exc

    try:
        texts = []
        confs = []
        pages = min(len(pdf), MAX_PDF_PAGES)

        for i in range(pages):
            page = pdf[i]
            embedded = page.get_text().strip()

            # Use embedded text for digital PDFs.
            if len(embedded) >= 30:
                texts.append(embedded)
                confs.append(100.0)
            else:
                # Scanned PDFs require image OCR.
                pix = page.get_pixmap(dpi=200)
                result = ocr_image(pix.tobytes("png"))

                texts.append(result["text"])
                confs.append(result["confidence"])

        confidence = (
            round(sum(confs) / len(confs), 1)
            if confs
            else 0.0
        )

        return {
            "text": "\n\n".join(texts),
            "confidence": confidence,
            "pages": pages,
        }

    finally:
        pdf.close()


def run_ocr(data, mimetype="", filename=""):
    """Choose image or PDF OCR based on uploaded file."""

    is_pdf = (
        data[:4] == b"%PDF"
        or mimetype == "application/pdf"
        or filename.lower().endswith(".pdf")
    )

    if is_pdf:
        return ocr_pdf(data)

    return ocr_image(data)
