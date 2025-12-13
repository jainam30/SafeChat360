import os
import google.generativeai as genai

# Configure API Key (Try to get from environment)
API_KEY = os.getenv("GEMINI_API_KEY")

if API_KEY:
    genai.configure(api_key=API_KEY)

def improve_text(text: str) -> str:
    """
    Improves the given text using Google Gemini.
    """
    if not text or len(text) < 2:
        return text

    if not API_KEY:
        # Fallback if no key provided
        print("AI Assistant: Missing GEMINI_API_KEY")
        # Optional: Use simple capitalization/punctuation fixer or return original
        return text + " [AI Setup Required: Add GEMINI_API_KEY]"

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"Rewrite the following text to be more polite, grammatically correct, and professional. Keep the meaning the same. Return ONLY the improved text, no explanations.\n\nText: {text}"
        
        response = model.generate_content(prompt)
        
        if response and response.text:
            cleaned = response.text.strip()
            # Remove quotes if model added them
            if cleaned.startswith('"') and cleaned.endswith('"'):
                cleaned = cleaned[1:-1]
            return cleaned
            
    except Exception as e:
        print(f"AI Assistant Gemini Error: {e}")
        
    return text

