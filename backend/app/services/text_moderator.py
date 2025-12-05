from typing import Dict
import re

try:
    from transformers import pipeline
except Exception:
    pipeline = None

_model = None

# List of inappropriate keywords/patterns
BLOCKED_KEYWORDS = {
    # Sexual/nudity related
    r'\b(porn|xxx|nsfw|nude|naked|sex|sexual|orgasm|masturbat|dick|pussy|cock)\b',
    # Abusive/offensive
    r'\b(fuck|shit|damn|bastard|asshole|bitch|slut|whore|cunt|nigger|retard|idiot|stupid|dumbass|loser)\b',
    # Violence/hate
    r'\b(kill|murder|suicide|terrorist|hate|racist|homophobic)\b',
    # Drug related
    r'\b(cocaine|heroin|meth|weed|drugs|dealer)\b',
}

def _load_model(model_name="unitary/toxic-bert"):
    global _model
    if _model is None:
        if pipeline is None:
            raise RuntimeError("transformers not installed")
        try:
            _model = pipeline("text-classification", model=model_name, return_all_scores=True)
        except:
            _model = False  # Mark as failed so we don't retry
    return _model

def _check_keywords(text: str) -> Dict:
    """Check for blocked keywords using regex patterns"""
    flags = []
    for pattern in BLOCKED_KEYWORDS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            flags.append({
                "type": "keyword_match",
                "label": "KEYWORD_BLOCKED",
                "score": 1.0,
                "pattern": pattern[:50],
                "matched_words": list(set(matches))[:3]  # Show up to 3 matched words
            })
    return {"is_flagged": len(flags) > 0, "flags": flags}

def moderate_text(text: str) -> Dict:
    if not text:
        return {"is_flagged": False, "flags": []}
    
    try:
        # First check against keyword blocklist (fast)
        keyword_result = _check_keywords(text)
        if keyword_result["is_flagged"]:
            return keyword_result
        
        # Then use ML model if available (slower but more accurate)
        model = _load_model()
        if model and model != False:
            outputs = model(text[:512])  # Limit text length for model
            flags = []
            is_flagged = False
            for o in outputs[0]:
                label = o.get('label')
                score = float(o.get('score', 0))
                if label.lower() in ['toxic', 'obscene', 'threat', 'severe_toxic', 'identity_hate', 'insult'] and score >= 0.6:
                    is_flagged = True
                    flags.append({"type": "ml_model", "label": label, "score": round(score, 3)})
            if is_flagged:
                return {"is_flagged": True, "flags": flags}
        
        return {"is_flagged": False, "flags": []}
    except Exception as e:
        return {"error": str(e), "is_flagged": False}
