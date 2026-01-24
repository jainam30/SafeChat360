import os

print("--- ENV VAR DUMP ---")
for key, value in os.environ.items():
    if key == "DATABASE_URL":
        print(f"{key}={value}")
    elif "POSTGRES" in key.upper() or "DB" in key.upper():
        print(f"{key}={value}")
print("--- END DUMP ---")
