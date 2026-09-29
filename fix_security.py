import os

with open('backend/app/utils/security.py', 'r', encoding='utf-8') as f:
    content = f.read()

bad_func = '''    is_valid = False
    
    if pwd_context.verify(sha256_password, hashed_password):
        is_valid = True
    else:
        try:
            if pwd_context.verify(plain_password, hashed_password):
                is_valid = True
        except Exception:
            is_valid = False'''

good_func = '''    is_valid = False
    
    try:
        if pwd_context.verify(sha256_password, hashed_password):
            is_valid = True
        else:
            if pwd_context.verify(plain_password, hashed_password):
                is_valid = True
    except Exception:
        is_valid = False'''

content = content.replace(bad_func, good_func)
with open('backend/app/utils/security.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed verify_password 500 error!")
