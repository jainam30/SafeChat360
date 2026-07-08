from pydantic import BaseModel

class TextModerationRequest(BaseModel):
    text: str
