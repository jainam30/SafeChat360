import re

with open('frontend/src/pages/AuthPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

submit_old = '''        const data = await response.json();
        
        if (response.ok) {
          toast.success('Account created! Please verify your email.');
          navigate('/verify-email', { state: { email: formData.email } });
        } else {
          toast.error((typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) || 'Registration failed');
        }'''

submit_new = '''        const data = await response.json();
        
        if (response.ok) {
          toast.success('Account created successfully!');
          if (data.access_token) {
            login(data.access_token);
            navigate('/dashboard');
          } else {
            navigate('/login');
          }
        } else {
          toast.error((typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) || 'Registration failed');
        }'''

content = content.replace(submit_old, submit_new)
with open('frontend/src/pages/AuthPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated registration success flow")
