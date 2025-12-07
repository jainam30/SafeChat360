from typing import Dict
import re

try:
    from transformers import pipeline
except Exception:
    pipeline = None

_model = None

from deep_translator import GoogleTranslator

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

def _translate_to_english(text: str) -> dict:
    try:
        # Detect is not strictly needed if we just translate to 'en', google handles it.
        # But to know if we translated, we check input vs output or use explicit detection (which requires key or lib)
        # GoogleTranslator(source='auto', target='en') works well.
        translator = GoogleTranslator(source='auto', target='en')
        translated = translator.translate(text)
        
        # Simple heuristic to guess if it was translated (not perfect but good enough for MVP)
        # Or we rely on the fact that if it changed significantly, it was likely another language.
        original_lang = "unknown" # Deep translator doesn't easily return detected lang in one call without extra tools
        if translated != text:
             original_lang = "detected_non_english"
        else:
             original_lang = "en"
             
        return {"text": translated, "original_language": original_lang}
    except Exception as e:
        print(f"Translation error: {e}")
        return {"text": text, "original_language": "error"}

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

def _check_keywords(text: str, additional_keywords: list = None) -> Dict:
    """Check for blocked keywords using regex patterns"""
    flags = []
    
    # Merge static and dynamic patterns
    patterns = BLOCKED_KEYWORDS.copy()
    if additional_keywords:
        for kw in additional_keywords:
            if not kw: continue
            patterns.add(rf'\b{re.escape(kw)}\b')

    for pattern in patterns:
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

def moderate_text(text: str, additional_keywords: list = None) -> Dict:
    if not text:
        return {"is_flagged": False, "flags": []}
    
    try:
        # 1. Translate to English
        trans_res = _translate_to_english(text)
        text_to_check = trans_res["text"]
        original_lang = trans_res["original_language"]

        # 2. Keywork Check
        keyword_result = _check_keywords(text_to_check, additional_keywords)
        if keyword_result["is_flagged"]:
            keyword_result["original_language"] = original_lang
            keyword_result["translated_text"] = text_to_check if original_lang != "en" else None
            return keyword_result
        
        # 3. Model Check
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
                return {
                    "is_flagged": True, 
                    "flags": flags,
                    "original_language": original_lang,
                    "translated_text": text_to_check if original_lang != "en" else None
                }
        
        return {
            "is_flagged": False, 
            "flags": [],
            "original_language": original_lang
        }
    except Exception as e:
        return {"error": str(e), "is_flagged": False}
