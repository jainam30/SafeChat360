import os

def check_for_null_bytes(directory):
    corrupted_files = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".py"):
                path = os.path.join(root, file)
                try:
                    with open(path, "rb") as f:
                        content = f.read()
                        if b"\x00" in content:
                            print(f"CORRUPTED: {path}")
                            corrupted_files.append(path)
                except Exception as e:
                    print(f"Error reading {path}: {e}")
    
    if not corrupted_files:
        print("No corrupted files found.")

if __name__ == "__main__":
    print("Scanning for null bytes in backend/...")
    check_for_null_bytes(".")
