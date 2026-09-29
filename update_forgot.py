import re

with open('frontend/src/pages/ForgotPassword.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

submit_old = '''      const response = await fetch(getApiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to send reset link');
      }'''

submit_new = '''      // Backend password reset is not currently supported.
      // Simulating truthful unsupported behavior per Phase 7 requirements.
      toast.error('Password reset is not configured on the server yet.');
      setLoading(false);
      return;'''

content = content.replace(submit_old, submit_new)
with open('frontend/src/pages/ForgotPassword.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated ForgotPassword unsupported state")
