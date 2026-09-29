import os
import re

with open('frontend/src/pages/AuthPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
imports_to_add = '''import { Phone } from 'lucide-react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { parsePhoneNumber } from 'libphonenumber-js';'''

content = content.replace("import { getApiUrl } from '../config';", "import { getApiUrl } from '../config';\n" + imports_to_add)

# Add phone to state
state_replace = '''  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phoneNumber: '',
    countryCode: '+91',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });'''
content = re.sub(r'const \[formData, setFormData\] = useState\(\{[\s\S]*?agreeTerms: false\n  \}\);', state_replace, content)

with open('frontend/src/pages/AuthPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated AuthPage imports and state")
