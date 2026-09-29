import os
import re

with open('frontend/src/context/CallContext.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

bad_ws = "wsUrl = \\\\/api/chat/ws/\\?token=\\\\;"
good_ws = "const deviceId = 'web_' + Math.random().toString(36).substring(7);\n            wsUrl = \\\\/api/chat/ws/\\?token=\\&device_id=\\\\;"

content = content.replace(bad_ws, good_ws)
with open('frontend/src/context/CallContext.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed multi-tab websocket bug!")
