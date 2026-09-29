import os

with open('frontend/src/pages/AuthPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

bad_login = '''      if (isLogin) {
        const params = new URLSearchParams();
        params.append('username', formData.email);
        params.append('password', formData.password);

        const response = await fetch(getApiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params
        });'''

good_login = '''      if (isLogin) {
        const response = await fetch(getApiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: formData.email,
            password: formData.password
          })
        });'''

content = content.replace(bad_login, good_login)
with open('frontend/src/pages/AuthPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done fixing login request JSON")
