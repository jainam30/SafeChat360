
from transformers import pipeline

# Load a text classification pipeline (example: toxicity)
classifier = pipeline("text-classification", model="unitary/toxic-bert")

def moderate_text(text: str):
    results = classifier(text)
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
        "text": text,
        "flags": flagged,
        "is_flagged": len(flagged) > 0
    }
