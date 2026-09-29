import re

with open('frontend/src/pages/AuthPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

submit_old = '''      } else {
        const response = await fetch(getApiUrl('/api/auth/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            username: formData.username,
            full_name: formData.fullName
          })
        });

        const data = await response.json();
        
        if (response.ok) {
          toast.success('Account created! Please verify your email.');
          navigate('/verify-email', { state: { email: formData.email } });
        } else {
          toast.error((typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) || 'Registration failed');
        }
      }'''

submit_new = '''      } else {
        const fullPhoneNumber = formData.countryCode + formData.phoneNumber.trim();
        if (!formData.phoneNumber.trim()) {
          toast.error('Please enter your mobile number.');
          setLoading(false);
          return;
        }
        try {
          const parsedNumber = parsePhoneNumber(fullPhoneNumber);
          if (!parsedNumber || !parsedNumber.isValid()) {
            toast.error('Invalid Phone Number format.');
            setLoading(false);
            return;
          }
        } catch (parseError) {
          toast.error('Invalid Phone Number format.');
          setLoading(false);
          return;
        }

        let firebaseUser;
        let token;
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
          firebaseUser = userCredential.user;
          token = await firebaseUser.getIdToken();
        } catch (firebaseErr) {
          if (firebaseErr.code === 'auth/email-already-in-use') {
            toast.success("Account already exists! Redirecting to Login...");
            setTimeout(() => navigate('/login'), 2000);
            return;
          }
          throw new Error(firebaseErr.message);
        }

        const response = await fetch(getApiUrl('/api/auth/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            username: formData.username,
            full_name: formData.fullName,
            phone_number: fullPhoneNumber,
            firebase_token: token
          })
        });

        const data = await response.json();
        
        if (response.ok) {
          toast.success('Account created! Please verify your email.');
          navigate('/verify-email', { state: { email: formData.email } });
        } else {
          toast.error((typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) || 'Registration failed');
        }
      }'''

content = content.replace(submit_old, submit_new)
with open('frontend/src/pages/AuthPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated handleSubmit")
