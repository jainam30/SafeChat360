import React, { useState, useEffect } from 'react';
import { X, Users, Check } from 'lucide-react';
import { getApiUrl } from '../config';

const CreateGroupModal = ({ onClose, onCreated, token }) => {
    const [name, setName] = useState('');
    const [friends, setFriends] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchFriends();
    }, []);

    const fetchFriends = async () => {
        try {
            const res = await fetch(getApiUrl('/api/friends/'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setFriends(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    const toggleMember = (id) => {
        if (selectedMembers.includes(id)) {
            setSelectedMembers(prev => prev.filter(m => m !== id));
        } else {
            setSelectedMembers(prev => [...prev, id]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setLoading(true);

        try {
            const res = await fetch(getApiUrl('/api/groups/'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    member_ids: selectedMembers
                })
            });

            if (res.ok) {
                const group = await res.json();
                onCreated(group);
                onClose();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-cyber-card border border-white/10 rounded-2xl w-full max-w-md p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-cyber-muted hover:text-white">
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Users className="text-cyber-primary" /> Create Group
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-cyber-muted mb-2">Group Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="glass-input w-full"
                            placeholder="e.g. Project Team"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-cyber-muted mb-2">Add Members</label>
                        <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1 bg-black/20 rounded-lg p-2 border border-white/5">
                            {friends.length === 0 ? (
                                <p className="text-center text-xs text-cyber-muted py-4">No friends found. Add friends first!</p>
                            ) : (
                                friends.map(friend => (
                                    <div
                                        key={friend.id}
                                        onClick={() => toggleMember(friend.id)}
                                        className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${selectedMembers.includes(friend.id) ? 'bg-cyber-primary/20 border border-cyber-primary/30' : 'hover:bg-white/5 border border-transparent'
                                            }`}
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedMembers.includes(friend.id) ? 'bg-cyber-primary border-cyber-primary text-black' : 'border-cyber-muted'
                                            }`}>
                                            {selectedMembers.includes(friend.id) && <Check size={10} strokeWidth={4} />}
                                        </div>
                                        <span className="text-sm text-white">{friend.username}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !name.trim()}
                        className="glass-button-primary w-full justify-center"
                    >
                        {loading ? 'Creating...' : 'Create Group'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupModal;
