import os, tempfile, base64
from typing import Dict

from app.services.text_moderator import moderate_text

_whisper = None

def _load_whisper(name="base"):
    global _whisper
    if _whisper is None:
        try:
            import whisper
            _whisper = whisper.load_model(name)
        except Exception as e:
            print(f"Failed to load whisper: {e}")
            raise RuntimeError(f"whisper not installed or failed: {e}")
    return _whisper

def moderate_audio_base64(b64_str: str, model_name="base") -> Dict:
    """Moderate audio by transcribing and checking content"""
    if not b64_str:
        raise ValueError("empty audio")
    
    try:
        audio_bytes = base64.b64decode(b64_str)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
        
        try:
            model = _load_whisper(model_name)
            res = model.transcribe(tmp_path)
            transcript = res.get("text", "").strip()
            
            # Moderate the transcribed text
            moderation = moderate_text(transcript)
            
            return {
                "is_flagged": moderation.get("is_flagged", False),
                "transcript": transcript,
                "transcript_length": len(transcript),
                "moderation": moderation,
                "reason": "Inappropriate language/content detected in audio transcript" if moderation.get("is_flagged") else "Audio is clean"
            }
        finally:
            try:
                os.remove(tmp_path)
            except:
                pass
    
    except Exception as e:
        return {
            "error": str(e),
            "is_flagged": False,
            "transcript": "",
            "moderation": {}
        }
