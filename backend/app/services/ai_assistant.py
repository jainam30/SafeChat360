try:
    from transformers import pipeline
except ImportError:
    pipeline = None

_assistant_model = None

def _load_model():
    global _assistant_model
    if _assistant_model is None:
        if pipeline is None:
            print("AI Assistant: Transformers not installed.")
            return None
        try:
            # Using flan-t5-small for speed and reasonable instruction following on CPU
            print("AI Assistant: Loading model google/flan-t5-small...")
            _assistant_model = pipeline("text2text-generation", model="google/flan-t5-small")
        except Exception as e:
            print(f"AI Assistant: Failed to load model: {e}")
            _assistant_model = False
    return _assistant_model

def improve_text(text: str) -> str:
    """
    Improves the given text using a seq2seq model.
    Instructions: "Fix grammar and make it polite: "
    """
    if not text or len(text) < 2:
        return text

    model = _load_model()
    if not model:
        return text # Fallback to original

    try:
        # Prompt engineering for Flan-T5
        prompt = f"Fix grammar and polish: {text}"
        
        # Inference
        results = model(prompt, max_length=128, do_sample=False)
        if results and len(results) > 0:
            return results[0]['generated_text']
            
    except Exception as e:
        print(f"AI Assistant Inference Error: {e}")
        
    return text
