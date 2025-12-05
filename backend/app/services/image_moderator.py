import base64
import io
from PIL import Image
from typing import Dict

try:
    from transformers import pipeline
except Exception:
    pipeline = None

_nsfw_model = None

def _load_nsfw_model():
    """Load NSFW detection model from HuggingFace"""
    global _nsfw_model
    if _nsfw_model is None:
        if pipeline is None:
            return None
        try:
            _nsfw_model = pipeline("image-classification", model="Falconsai/nsfw_image_detection")
        except:
            _nsfw_model = False  # Mark as failed
    return _nsfw_model

def _check_image_properties(img: Image.Image) -> Dict:
    """Check basic image properties for inappropriate content"""
    flags = []
    try:
        # Check image size
        w, h = img.size
        aspect_ratio = w / h if h > 0 else 0
        
        # Check if image is extremely small (potential thumbnail of inappropriate content)
        if w < 50 or h < 50:
            flags.append({"type": "image_size", "reason": "Image too small, suspicious"})
        
        # Check image mode (can indicate suspicious formats)
        mode = img.mode
        if mode not in ['RGB', 'RGBA', 'L', 'P']:
            flags.append({"type": "image_format", "reason": f"Unusual format: {mode}"})
        
        # Analyze color distribution (very high contrast can indicate explicit content)
        if mode == 'RGB':
            pixels = img.getdata()
            pixel_list = list(pixels)
            if len(pixel_list) > 100:
                # Simple heuristic: check for skin tone dominance
                skin_tones = sum(1 for r, g, b in pixel_list[:1000] 
                                if 95 < r < 220 and 75 < g < 195 and 65 < b < 180)
                skin_percentage = (skin_tones / min(1000, len(pixel_list))) * 100
                if skin_percentage > 60:
                    flags.append({"type": "skin_tone_dominant", "confidence": f"{skin_percentage:.1f}%"})
        
    except Exception as e:
        pass
    
    return {"has_flags": len(flags) > 0, "flags": flags}

def moderate_image_base64(b64_str: str) -> Dict:
    """Moderate image for NSFW and inappropriate content"""
    if not b64_str:
        return {"is_flagged": False, "details": {}}
    
    try:
        img_bytes = base64.b64decode(b64_str)
        img = Image.open(io.BytesIO(img_bytes))
        w, h = img.size
        
        result = {
            "is_flagged": False,
            "details": {
                "width": w,
                "height": h,
                "format": img.format,
                "mode": img.mode
            },
            "flags": []
        }
        
        # Check basic image properties
        prop_check = _check_image_properties(img)
        if prop_check["has_flags"]:
            result["flags"].extend(prop_check["flags"])
            result["is_flagged"] = True
        
        # Try NSFW model if available
        model = _load_nsfw_model()
        if model and model != False:
            try:
                predictions = model(img)
                for pred in predictions:
                    label = pred.get('label', '').lower()
                    score = float(pred.get('score', 0))
                    
                    # Flag if NSFW/pornography detected with high confidence
                    if label in ['nsfw', 'porn', 'hentai', 'sexy'] and score > 0.5:
                        result["is_flagged"] = True
                        result["flags"].append({
                            "type": "nsfw_model",
                            "label": label,
                            "confidence": round(score, 3)
                        })
            except Exception as e:
                pass  # Model inference failed, continue with other checks
        
        return result
        
    except Exception as e:
        return {"error": str(e), "is_flagged": False, "details": {}}
