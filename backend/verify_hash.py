import hashlib

def get_password_hash(password: str) -> str:
    pwd_str = str(password).strip()
    return hashlib.pbkdf2_hmac('sha256', pwd_str.encode(), b'salt_dev', 100000).hex()

def verify(stored_hash, password):
    computed = get_password_hash(password)
    print(f"Password: {password}")
    print(f"Computed: {computed}")
    print(f"Stored:   {stored_hash}")
    print(f"Match:    {computed == stored_hash}")

if __name__ == "__main__":
    stored_hash = "abb266d351a45f7427177d3b09637d65d3360c7adbf794e031b5f84dff61b09ab"
    verify(stored_hash, "TempPass123!")
