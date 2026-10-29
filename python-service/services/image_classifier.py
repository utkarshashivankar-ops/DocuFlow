
"""Pretrained LipiOCR image-based document classifier."""

import json
import os
import time
from functools import lru_cache
from io import BytesIO

import timm
import torch
from PIL import Image, ImageOps
from safetensors.torch import load_file
from torchvision import transforms
from huggingface_hub import hf_hub_download


MODEL_ID = os.getenv(
    "DOCUFLOW_MODEL_ID",
    "krishBSSPL/lipiocr-classifier",
)

DEVICE = torch.device("cpu")


@lru_cache(maxsize=1)
def _load_model():
    """Load the pretrained model once and reuse it."""

    config_path = hf_hub_download(
        repo_id=MODEL_ID,
        filename="config.json",
    )

    weights_path = hf_hub_download(
        repo_id=MODEL_ID,
        filename="model.safetensors",
    )

    with open(config_path, "r", encoding="utf-8") as file:
        config = json.load(file)

    labels = (
        config.get("labels")
        or config.get("class_names")
        or config.get("classes")
    )

    if isinstance(labels, dict):
        labels = [
            str(labels[key])
            for key in sorted(labels, key=lambda x: int(x))
        ]

    if not labels and isinstance(config.get("id2label"), dict):
        id2label = config["id2label"]
        labels = [
            str(id2label[key])
            for key in sorted(id2label, key=lambda x: int(x))
        ]

    if not labels and isinstance(config.get("label2id"), dict):
        labels = [
            str(label)
            for label, index in sorted(
                config["label2id"].items(),
                key=lambda item: int(item[1]),
            )
        ]

    if not labels:
        raise RuntimeError(
            "Could not find class labels in model config.json."
        )

    model = timm.create_model(
        config["architecture"],
        pretrained=False,
        num_classes=config["num_classes"],
    )

    state_dict = load_file(weights_path, device="cpu")
    model.load_state_dict(state_dict)
    model.to(DEVICE)
    model.eval()

    image_size = config.get("image_size", 224)
    if isinstance(image_size, (list, tuple)):
        image_size = image_size[-1]

    image_transform = transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=config.get("mean", [0.485, 0.456, 0.406]),
            std=config.get("std", [0.229, 0.224, 0.225]),
        ),
    ])

    return model, labels, image_transform


def classify_image(image_bytes):
    """Predict a document type from image bytes."""

    try:
        with Image.open(BytesIO(image_bytes)) as source:
            image = ImageOps.exif_transpose(source).convert("RGB")
            image.load()
    except Exception as exc:
        raise ValueError("Unable to read the document image.") from exc

    model, labels, image_transform = _load_model()
    tensor = image_transform(image).unsqueeze(0).to(DEVICE)

    started = time.perf_counter()

    with torch.inference_mode():
        logits = model(tensor)
        probabilities = torch.softmax(logits, dim=1)[0]

    elapsed_ms = round((time.perf_counter() - started) * 1000, 2)

    count = min(3, len(probabilities))
    values, indices = torch.topk(probabilities, k=count)

    top_predictions = [
        {
            "label": labels[index],
            "confidence": round(float(value) * 100, 2),
        }
        for value, index in zip(values.tolist(), indices.tolist())
    ]

    best = top_predictions[0]

    return {
        "label": best["label"],
        "confidence": best["confidence"],
        "topPredictions": top_predictions,
        "method": "lipiocr-image",
        "inferenceTimeMs": elapsed_ms,
    }
