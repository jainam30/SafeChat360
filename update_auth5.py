import re

with open('frontend/src/pages/AuthPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

submit_old = '''    if (!isLogin && !formData.agreeTerms) {
      toast.error('You must agree to the Terms of Service');
      return;
    }

    setLoading(true);'''

submit_new = '''    if (!isLogin && !formData.agreeTerms) {
      toast.error('You must agree to the Terms of Service');
      return;
    }
    
    if (!isLogin && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);'''

content = content.replace(submit_old, submit_new)
with open('frontend/src/pages/AuthPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated password validation")
