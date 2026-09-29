import urllib.request
import json

url = 'https://safechat-backend-xi1u.onrender.com/api/auth/login'
data = json.dumps({'identifier': 'test@test.com', 'password': 'test'}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'text/plain'})

try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Body:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code)
    print("Body:", e.read().decode('utf-8'))
