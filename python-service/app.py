
"""DocuFlow Python document-intelligence service.

Endpoints:
  GET  /health
  POST /ocr       multipart file=<image|pdf>
  POST /classify  JSON {"text": "..."}
  POST /process   multipart file=<image|pdf>
"""

import hmac
import os
import shutil
from pathlib import Path

import pytesseract
from flask import Flask, jsonify, request

from services.image_classifier import classify_image
from services.ocr_service import OcrError, run_ocr
from services.pipeline import analyse


# --------------------------------------------------
# Tesseract configuration
# --------------------------------------------------

DEFAULT_TESSERACT_EXE = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)


def configure_tesseract():
    """Configure Tesseract before handling OCR requests."""

    configured_path = os.getenv("TESSERACT_CMD", "").strip().strip('"')

    candidates = [
        configured_path,
        DEFAULT_TESSERACT_EXE,
        shutil.which("tesseract"),
    ]

    for candidate in candidates:
        if not candidate:
            continue

        candidate_path = Path(candidate)

        if candidate_path.is_file():
            pytesseract.pytesseract.tesseract_cmd = str(candidate_path)
            os.environ["TESSERACT_CMD"] = str(candidate_path)

            # Add its directory to PATH for Tesseract dependencies.
            os.environ["PATH"] = (
                str(candidate_path.parent)
                + os.pathsep
                + os.environ.get("PATH", "")
            )

            return str(candidate_path)

    raise RuntimeError(
        "Tesseract executable not found. "
        "Install Tesseract or set TESSERACT_CMD to its full path."
    )


TESSERACT_PATH = configure_tesseract()


# --------------------------------------------------
# Flask configuration
# --------------------------------------------------

app = Flask(__name__)

app.config["MAX_CONTENT_LENGTH"] = (
    int(os.getenv("MAX_UPLOAD_MB", "15")) * 1024 * 1024
)

SERVICE_KEY = os.getenv("PYTHON_SERVICE_KEY", "")


@app.before_request
def check_key():
    if request.path == "/health" or not SERVICE_KEY:
        return None

    supplied_key = request.headers.get("X-Service-Key", "")

    if not hmac.compare_digest(supplied_key, SERVICE_KEY):
        return jsonify(error="Unauthorized"), 401

    return None


def _file():
    uploaded_file = request.files.get("file")

    if not uploaded_file:
        return None, (
            jsonify(error="No file uploaded. Field name must be 'file'."),
            400,
        )

    return uploaded_file, None


# --------------------------------------------------
# Endpoints
# --------------------------------------------------

@app.get("/health")
def health():
    return jsonify(
        status="ok",
        classifier="image + text",
        tesseract="configured",
    )


@app.post("/ocr")
def ocr():
    uploaded_file, error = _file()

    if error:
        return error

    try:
        result = run_ocr(
            uploaded_file.read(),
            uploaded_file.mimetype or "",
            uploaded_file.filename or "",
        )
        return jsonify(result)

    except OcrError as exc:
        app.logger.exception("OCR processing failed")
        return jsonify(error=str(exc)), 422

    except Exception:
        app.logger.exception("Unexpected OCR error")
        return jsonify(error="Internal OCR processing error."), 500


@app.post("/classify")
def classify_route():
    body = request.get_json(silent=True) or {}
    text = body.get("text")

    if not isinstance(text, str):
        return jsonify(
            error="JSON body must contain a 'text' string."
        ), 400

    return jsonify(analyse(text))


@app.post("/process")
def process():
    uploaded_file, error = _file()

    if error:
        return error

    data = uploaded_file.read()
    filename = uploaded_file.filename or ""
    mimetype = uploaded_file.mimetype or ""

    # Step 1: OCR
    try:
        ocr_result = run_ocr(data, mimetype, filename)

    except OcrError as exc:
        app.logger.exception("OCR failed in /process")
        return jsonify(error=str(exc)), 422

    except Exception:
        app.logger.exception("Unexpected failure in /process OCR")
        return jsonify(error="Internal OCR processing error."), 500

    # Step 2: Detect PDF
    is_pdf = (
        data.startswith(b"%PDF")
        or mimetype.lower() == "application/pdf"
        or filename.lower().endswith(".pdf")
    )

    # Step 3: Image classification for non-PDF files
    image_prediction = None

    if not is_pdf:
        try:
            image_prediction = classify_image(data)
        except Exception:
            app.logger.exception(
                "Image classifier failed; using text fallback."
            )

    # Step 4: Combine OCR text and image prediction
    try:
        analysis = analyse(
            ocr_result["text"],
            image_prediction=image_prediction,
        )
    except Exception:
        app.logger.exception("Document analysis failed")
        return jsonify(error="Document analysis failed."), 500

    return jsonify(
        {
            "ocr": ocr_result,
            "analysis": analysis,
            "imagePrediction": image_prediction,
        }
    )


@app.errorhandler(413)
def too_large(_error):
    return jsonify(error="File is too large."), 413


@app.errorhandler(Exception)
def unhandled(error):
    app.logger.exception("Unhandled application error: %s", error)
    return jsonify(error="Internal processing error."), 500


if __name__ == "__main__":
    print(f"[startup] Python executable: {os.sys.executable}")
    print(f"[startup] Tesseract executable: {TESSERACT_PATH}")

    # Confirm Tesseract is executable before accepting requests.
    try:
        print(
            f"[startup] Tesseract version: "
            f"{pytesseract.get_tesseract_version()}"
        )
    except Exception as exc:
        raise RuntimeError(
            f"Tesseract is configured but cannot execute: {exc}"
        ) from exc

    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        debug=False,
    )
