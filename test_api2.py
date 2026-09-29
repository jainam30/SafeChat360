import urllib.request
import json

url = 'https://safechat-backend-xi1u.onrender.com/api/auth/login'
data = json.dumps({'identifier': 'test@test.com', 'password': 'test'}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={
    'Content-Type': 'application/json',
    'Origin': 'https://safe-chat360.vercel.app'
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
