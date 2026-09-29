import os

with open('frontend/src/pages/AuthPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add handleGoogleLogin
handle_google_str = '''  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();

      const verifyRes = await fetch(getApiUrl('/api/auth/verify-identity'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebase_token: token, device_id: navigator.userAgent }),
      });

      const verifyData = await verifyRes.json();

      if (verifyRes.ok && verifyData.access_token) {
        toast.success("Google Login successful!");
        login(verifyData.access_token);
        navigate('/dashboard');
      } else {
        throw new Error((typeof verifyData.detail === 'string' ? verifyData.detail : JSON.stringify(verifyData.detail)) || "Google Login failed.");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Google sign in failed");
    } finally {
      setLoading(false);
    }
  };'''

if "const handleGoogleLogin" not in content:
    content = content.replace("  const handleSubmit = async (e) => {", handle_google_str + "\n\n  const handleSubmit = async (e) => {")

# 2. Attach it to the button
button_old = '''<button type="button" className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-3">
                <svg className="w-5 h-5"'''
button_new = '''<button type="button" onClick={handleGoogleLogin} disabled={loading} className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-70">
                <svg className="w-5 h-5"'''
content = content.replace(button_old, button_new)

with open('frontend/src/pages/AuthPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Wired Google Login")
