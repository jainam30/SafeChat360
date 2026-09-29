import os
import re

files = [
    'frontend/src/pages/AuthPage.jsx',
    'frontend/src/pages/Register.jsx',
    'frontend/src/pages/VerifyEmail.jsx',
    'frontend/src/pages/Login.jsx',
    'frontend/src/pages/Chat.jsx',
    'frontend/src/pages/SocialFeed.jsx'
]

# Helper replacement function for data.detail
def fix_detail(content):
    # This is a bit tricky with regex. Let's just write a helper func inside the JS files if we can,
    # or just replace the common pattern.
    # Pattern: data.detail ||
    content = content.replace("data.detail ||", "(typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) ||")
    content = content.replace("err.detail ||", "(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail)) ||")
    content = content.replace("verifyData.detail ||", "(typeof verifyData.detail === 'string' ? verifyData.detail : JSON.stringify(verifyData.detail)) ||")
    return content

for file in files:
    if os.path.exists(file):
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = fix_detail(content)
        
        if new_content != content:
            with open(file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Fixed {file}")
