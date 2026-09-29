import re

with open('frontend/src/components/Layout/Sidebar.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the import
content = re.sub(r'import \{ Home, Bookmark, MessageSquare, Users, User, Clock, Image as ImageIcon, Bookmark, Search, Bell, Settings, Shield, HelpCircle, Cloud, AlertTriangle \} from \'lucide-react\';',
                 r'import { Home, Bookmark, MessageSquare, Users, User, Clock, Image as ImageIcon, Search, Bell, Settings, Shield, HelpCircle, Cloud, AlertTriangle } from \'lucide-react\';',
                 content)

# And if there's any other duplicate Bookmark import:
content = re.sub(r'Bookmark,\s*Bookmark', 'Bookmark', content)

# Remove the duplicated navigation items
# Let's just find and replace the whole array
old_array = r'''    const baseItems = \[
        \{ to: '/dashboard', label: 'Home', icon: Home \},
        \{ to: '/chats', label: 'Chats', icon: MessageSquare, id: 'chats' \},
        \{ to: '/groups', label: 'Groups', icon: Users, id: 'groups' \},
        \{ to: '/contacts', label: 'Contacts', icon: User, id: 'contacts' \}, // Using contacts for both Friends/Contacts
        \{ to: '/media', label: 'Media', icon: Image, id: 'media' \},
        \{ to: '/saved', label: 'Saved Items', icon: Bookmark, id: 'saved' \},
        \{ to: '/social', label: 'Stories', icon: Clock \},
        \{ to: '/media', label: 'Media', icon: ImageIcon \},
        \{ to: '/saved', label: 'Saved', icon: Bookmark \},
        \{ to: '/explore', label: 'Explore', icon: Search \},
        \{ to: '/notifications', label: 'Notifications', icon: Bell, id: 'notifications' \},
        \{ to: '/settings', label: 'Settings', icon: Settings \},
        \{ to: '/security', label: 'Security & Privacy', icon: Shield \},
        \{ to: '/help', label: 'Help & Support', icon: HelpCircle \},
    \];'''

new_array = r'''    const baseItems = [
        { to: '/dashboard', label: 'Home', icon: Home },
        { to: '/chats', label: 'Chats', icon: MessageSquare, id: 'chats' },
        { to: '/groups', label: 'Groups', icon: Users, id: 'groups' },
        { to: '/contacts', label: 'Contacts', icon: User, id: 'contacts' },
        { to: '/media', label: 'Media', icon: ImageIcon, id: 'media' },
        { to: '/saved', label: 'Saved Items', icon: Bookmark, id: 'saved' },
        { to: '/social', label: 'Stories', icon: Clock },
        { to: '/explore', label: 'Explore', icon: Search },
        { to: '/notifications', label: 'Notifications', icon: Bell, id: 'notifications' },
        { to: '/settings', label: 'Settings', icon: Settings },
        { to: '/security', label: 'Security & Privacy', icon: Shield },
        { to: '/help', label: 'Help & Support', icon: HelpCircle },
    ];'''

content = re.sub(old_array, new_array, content)
with open('frontend/src/components/Layout/Sidebar.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done fixing Sidebar.jsx")
