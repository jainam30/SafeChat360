import requests
import json

url = "http://localhost:8000/api/auth/login"
payload = {
    "identifier": "jainamjainrj@gmail.com",
    "password": "password123",
    "device_id": "test_script_device"
}
headers = {
    "Content-Type": "application/json"
}

try:
    print(f"Sending POST request to {url}...")
    response = requests.post(url, json=payload, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print("Response Headers:", response.headers)
    print("Raw Response Context:", response.text[:500])
    
    try:
        data = response.json()
        print("JSON Response:", json.dumps(data, indent=2))
    except json.JSONDecodeError:
        print("Response is NOT valid JSON.")
except Exception as e:
    print(f"Request failed: {e}")
