import urllib.request
import json

url = 'https://safechat-backend-xi1u.onrender.com/api/auth/login'
req = urllib.request.Request(url, method='OPTIONS', headers={
    'Origin': 'https://safe-chat360.vercel.app',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'Content-Type'
})

try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Headers:", response.headers)
        print("Body:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code)
    print("Headers:", e.headers)
    print("Body:", e.read().decode('utf-8'))
except Exception as e:
    print("Error:", str(e))
