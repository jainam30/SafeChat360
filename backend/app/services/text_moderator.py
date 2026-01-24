from typing import Dict
import re

try:
    from transformers import pipeline
except Exception:
    pipeline = None

_model = None

try:
    from deep_translator import GoogleTranslator
except Exception:
    GoogleTranslator = None

# List of inappropriate keywords/patterns
BLOCKED_KEYWORDS = {
    # English - Sexual/Nudity
    r'\b(porn|xxx|nsfw|nude|naked|sex|sexual|orgasm|masturbat|dick|pussy|cock|vagina|penis|boobs|tits)\b',
    # English - Abusive/Offensive
    r'\b(fuck|shit|damn|bastard|asshole|bitch|slut|whore|cunt|nigger|nigga|faggot|dyke|retard|idiot|stupid|dumbass|loser|scum)\b',
    # English - Violence/Hate
    r'\b(kill|murder|suicide|terrorist|hate|racist|homophobic|rapist|rape|die)\b',
    # English - Drug related
    r'\b(cocaine|heroin|meth|weed|drugs|dealer|marijuana|lsd|ecstasy)\b',
    
    # Hindi / Hinglish
    r'\b(madarchod|bhenchod|benchod|bc|mc|bkl|mkc|tmkc|mkm|chutiya|kamina|kutta|kutti|saala|sale|harami|bhosdike|bhosda|gand|gaand|gandu|lund|loda|lawda|lavde|choot|chut|randi|raand|bhadwa|launda|suwar|chinaal|betichod|jhant)\b',
    
    # Spanish
    r'\b(puta|mierda|cabron|pendejo|coño|gilipollas|zorra|maricon|chinga)\b',
    
    # French
    r'\b(merde|putain|connard|salope|batard|encule)\b',
    
    # German
    r'\b(scheisse|arschloch|schlampe|fotze|verdammt)\b',

    # Variations/Obfuscations
    r'f+u+c+k+',
    r's+h+i+t+',
    r'b+i+t+c+h+',
}

def _translate_to_english(text: str) -> dict:
    try:
        # Detect is not strictly needed if we just translate to 'en', google handles it.
        # But to know if we translated, we check input vs output or use explicit detection (which requires key or lib)
        # GoogleTranslator(source='auto', target='en') works well.
        if GoogleTranslator is None:
             return {"text": text, "original_language": "unknown"}

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
            # Fallback: Just return False (failed to load) so we rely on keywords only
            # raise RuntimeError("transformers not installed") 
            _model = False
            return _model
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
        # 0. Check ORIGINAL text for Hinglish/Specific keywords (Best for exact matches like 'madarchod')
        keyword_result_original = _check_keywords(text, additional_keywords)
        if keyword_result_original["is_flagged"]:
             keyword_result_original["original_language"] = "original_match"
             return keyword_result_original

        # 1. Translate to English
        trans_res = _translate_to_english(text)
        text_to_check = trans_res["text"]
        original_lang = trans_res["original_language"]

        # 2. Keywork Check on TRANSLATED text
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
                if label.lower() in ['toxic', 'obscene', 'threat', 'severe_toxic', 'identity_hate', 'insult'] and score >= 0.5:
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
