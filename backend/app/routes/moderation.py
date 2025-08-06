
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.text_moderator import moderate_text

router = APIRouter()

class TextModerationRequest(BaseModel):
    text: str

@router.post("/moderate/text")
def moderate_text_api(request: TextModerationRequest):
    try:
        result = moderate_text(request.text)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
