# Image classification logic
from transformers import pipeline
from PIL import Image
import io
import base64

# Load Hugging Face NSFW classification pipeline
classifier = pipeline("image-classification", model="Falconsai/nsfw_image_detection")

def moderate_image_base64(base64_str: str):
    # Decode base64 to bytes
    image_data = base64.b64decode(base64_str)
    image = Image.open(io.BytesIO(image_data))

    results = classifier(image)
    flagged = []

    for result in results:
        label = result['label'].lower()
        score = result['score']
        if score > 0.6:
            flagged.append({
                "label": label,
                "score": round(score, 3)
            })

    return {
        "flags": flagged,
        "is_flagged": len(flagged) > 0
    }
