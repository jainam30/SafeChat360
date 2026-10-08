import { getApiUrl } from '../config';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Camera, Save, Lock, Shield, AlertCircle } from 'lucide-react';

const AVATARS = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Cyber",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Security",
    "https://api.dicebear.com/7.x/identicon/svg?seed=Safe",
    "https://api.dicebear.com/7.x/micah/svg?seed=User"
];

export default function Account() {
    const { token } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form states
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('');

    // Email update state
    const [newEmail, setNewEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showEmailForm, setShowEmailForm] = useState(false);

    // Password update state
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch(getApiUrl('/api/users/me'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setProfile(data);
                setFullName(data.full_name || '');
                setUsername(data.username || '');
                setSelectedAvatar(data.profile_photo || AVATARS[0]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch(getApiUrl('/api/users/me'), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    full_name: fullName,
                    username: username,
                    profile_photo: selectedAvatar
                })
            });

            const data = await res.json();
            if (res.ok) {
                setSuccess('Profile updated successfully');
                setProfile({ ...profile, ...data.data });
            } else {
                setError(data.detail || 'Update failed');
            }
        } catch (err) {
            setError('Update failed');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateEmail = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const res = await fetch(getApiUrl('/api/users/me/email'), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    new_email: newEmail,
                    password: password
                })
            });

            const data = await res.json();
            if (res.ok) {
                setSuccess('Email updated successfully');
                setProfile({ ...profile, email: data.data.email });
                setShowEmailForm(false);
                setNewEmail('');
                setPassword('');
            } else {
                setError(data.detail || 'Email update failed');
            }
        } catch (err) {
            setError('Update failed');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("New passwords don't match");
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch(getApiUrl('/api/users/me/password'), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword
                })
            });

            const data = await res.json();
            if (res.ok) {
                setSuccess('Password updated successfully');
                setShowPasswordForm(false);
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setError(data.detail || 'Password update failed');
            }
        } catch (err) {
            setError('Update failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-cyber-muted">Loading profile...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Shield className="text-cyber-primary" />
                    Account Settings
                </h1>
                <p className="text-cyber-muted">Manage your profile and security preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass-panel p-8 rounded-2xl">
                        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <User size={20} className="text-cyber-primary" />
                            Profile Information
                        </h2>

                        {error && (
                            <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm flex items-center gap-2">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-4 mb-6 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-sm flex items-center gap-2">
                                <Shield size={16} />
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            {/* Avatar Selection */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-cyber-muted mb-3">Profile Photo</label>
                                <div className="flex items-center gap-6">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-full bg-cyber-card border-2 border-cyber-primary/30 overflow-hidden">
                                            <img src={selectedAvatar} alt="Profile" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-cyber-primary text-black p-1.5 rounded-full">
                                            <Camera size={14} />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {AVATARS.map((avatar, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => setSelectedAvatar(avatar)}
                                                    className={`w-12 h-12 rounded-full border-2 transition-all ${selectedAvatar === avatar ? 'border-cyber-primary scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                                >
                                                    <img src={avatar} alt={`Avatar ${i}`} className="w-full h-full rounded-full" />
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-cyber-muted mt-2">Choose an animated avatar</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-cyber-muted ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="glass-input w-full"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-cyber-muted ml-1">Username</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="glass-input w-full"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="glass-button-primary flex items-center gap-2"
                                >
                                    {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Security Section */}
                    <div className="glass-panel p-8 rounded-2xl">
                        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <Lock size={20} className="text-cyber-primary" />
                            Security Settings
                        </h2>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-cyber-primary/10 rounded-lg text-cyber-primary">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">Email Address</p>
                                        <p className="text-xs text-cyber-muted">{profile?.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowEmailForm(!showEmailForm)}
                                    className="text-sm text-cyber-primary hover:text-cyber-secondary transition-colors"
                                >
                                    Change
                                </button>
                            </div>

                            {showEmailForm && (
                                <form onSubmit={handleUpdateEmail} className="p-4 bg-cyber-primary/5 rounded-xl border border-cyber-primary/10 space-y-4 animate-float">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-cyber-muted ml-1">New Email Address</label>
                                        <input
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            required
                                            className="glass-input w-full"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-cyber-muted ml-1">Confirm Password</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="glass-input w-full"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowEmailForm(false)}
                                            className="glass-button text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="glass-button-primary text-sm py-1.5"
                                        >
                                            Update Email
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        <div className="space-y-6 mt-6 pt-6 border-t border-white/5">
                            <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-cyber-primary/10 rounded-lg text-cyber-primary">
                                        <Lock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">Password</p>
                                        <p className="text-xs text-cyber-muted">Last changed recently</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                                    className="text-sm text-cyber-primary hover:text-cyber-secondary transition-colors"
                                >
                                    Change
                                </button>
                            </div>

                            {showPasswordForm && (
                                <form onSubmit={handleUpdatePassword} className="p-4 bg-cyber-primary/5 rounded-xl border border-cyber-primary/10 space-y-4 animate-float">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-cyber-muted ml-1">Current Password</label>
                                        <input
                                            type="password"
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            required
                                            className="glass-input w-full"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-cyber-muted ml-1">New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            className="glass-input w-full"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-cyber-muted ml-1">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="glass-input w-full"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswordForm(false)}
                                            className="glass-button text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="glass-button-primary text-sm py-1.5"
                                        >
                                            Update Password
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                {/* Read-only Info */}
                <div className="space-y-8">
                    <div className="glass-card p-6">
                        <h3 className="text-sm font-medium text-cyber-muted uppercase tracking-wider mb-4">Verified Contact</h3>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                                <Phone size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-cyber-muted">Registered Number</p>
                                <p className="text-lg font-mono text-white">{profile?.phone_number}</p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-cyber-muted bg-black/20 p-2 rounded">
                            <Lock size={12} />
                            <span>This number cannot be changed</span>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="text-sm font-medium text-cyber-muted uppercase tracking-wider mb-4">Account Status</h3>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-white">Trust Score</span>
                            <div className={`flex items-center gap-2 ${profile?.trust_score >= 80 ? 'text-green-400' : profile?.trust_score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                <Shield size={16} />
                                <span className="text-xl font-bold">{profile?.trust_score ?? 100}</span>
                            </div>
                        </div>
                        <div className="w-full bg-black/30 rounded-full h-1.5 mb-6">
                            <div
                                className={`h-full rounded-full ${profile?.trust_score >= 80 ? 'bg-green-500' : profile?.trust_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${profile?.trust_score ?? 100}%` }}
                            ></div>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                            <span className="text-white">Role</span>
                            <span className="px-2 py-1 rounded bg-cyber-primary/10 text-cyber-primary text-xs font-bold uppercase">{profile?.role}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-white">Member Since</span>
                            <span className="text-cyber-muted text-sm">{new Date(profile?.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
