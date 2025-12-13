try:
    import cv2
except Exception:
    cv2 = None
import os
import tempfile
import base64
from typing import Dict, List
from app.services.image_moderator import moderate_image_base64
from app.services.audio_moderator import moderate_audio_base64
from PIL import Image
import io

def moderate_video(file_path: str, frame_interval: int = 2) -> Dict:
    """
    Moderate video by analyzing frames and audio.
    frame_interval: Analyze 1 frame every X seconds.
    """
    if not os.path.exists(file_path):
        return {"error": "File not found", "is_flagged": False}

    flags = []
    is_flagged = False
    
    try:
        if cv2 is None:
            return {"error": "Video moderation disabled (OpenCV not installed)", "is_flagged": False}

        # 1. Analyze Frames
        cap = cv2.VideoCapture(file_path)
        if not cap.isOpened():
             print(f"Error: Could not open video file {file_path}")
             return {"error": "Could not open video file", "is_flagged": False}
             
        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps <= 0: fps = 24 # Fallback
        
        frame_step = int(fps * frame_interval)
        
        current_frame = 0
        scanned_frames = 0
        
        while True:
            # Jump to next frame
            cap.set(cv2.CAP_PROP_POS_FRAMES, current_frame)
            ret, frame = cap.read()
            if not ret:
                break
                
            # Convert BGR (OpenCV) to RGB (PIL)
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(rgb_frame)
            
            # Convert to base64 for existing image moderator
            buff = io.BytesIO()
            pil_img.save(buff, format="JPEG")
            b64_str = base64.b64encode(buff.getvalue()).decode("utf-8")
            
            # Check frame
            res = moderate_image_base64(b64_str)
            if res.get("is_flagged"):
                timestamp = current_frame / fps
                flags.append({
                    "type": "visual_content",
                    "timestamp": f"{int(timestamp//60)}:{int(timestamp%60):02d}",
                    "details": res.get("flags", [])
                })
                is_flagged = True
                
            current_frame += frame_step
            scanned_frames += 1
            
            # Safety break for huge videos in demo
            if scanned_frames > 50: 
                break
                
        cap.release()

        # 2. Analyze Audio (using Whisper via existing moderator)
        import shutil
        if not shutil.which("ffmpeg"):
            print("Warning: ffmpeg not found. Skipping audio moderation.")
            flags.append({
                "type": "system_warning",
                "timestamp": "N/A",
                "details": [{"label": "Audio analysis skipped: ffmpeg not installed on server"}]
            })
        else:
            try:
                # Read file as bytes to pass to audio moderator
                with open(file_path, "rb") as f:
                    file_bytes = f.read()
                    b64_audio = base64.b64encode(file_bytes).decode("utf-8")
                    
                audio_res = moderate_audio_base64(b64_audio)
                if audio_res.get("is_flagged"):
                    is_flagged = True
                    flags.append({
                        "type": "audio_content",
                        "timestamp": "Full Audio",
                        "details": audio_res.get("moderation", {}).get("flags", [])
                    })
                    
            except Exception as e:
                print(f"Audio moderation failed: {e}")

        return {
            "is_flagged": is_flagged,
            "flags": flags,
            "scanned_frames": scanned_frames
        }

            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e), "is_flagged": False}
