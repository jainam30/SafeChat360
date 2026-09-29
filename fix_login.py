import os

with open('frontend/src/pages/AuthPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

bad_login = '''      if (isLogin) {
        await login(formData.email, formData.password);
        toast.success('Successfully logged in!');
        navigate('/dashboard');
      } else {'''

good_login = '''      if (isLogin) {
        const params = new URLSearchParams();
        params.append('username', formData.email);
        params.append('password', formData.password);

        const response = await fetch(getApiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params
        });

        const data = await response.json();
        if (response.ok) {
          login(data.access_token);
          toast.success('Successfully logged in!');
          navigate('/dashboard');
        } else {
          toast.error(data.detail || 'Login failed. Check credentials.');
        }
      } else {'''

content = content.replace(bad_login, good_login)
with open('frontend/src/pages/AuthPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done fixing login API call!")
