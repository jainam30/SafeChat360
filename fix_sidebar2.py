import re

with open('frontend/src/components/Layout/Sidebar.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the lucide-react import
pattern = r"import \{.*?\} from 'lucide-react';"
replacement = "import { Home, MessageSquare, Users, User, Clock, Image as ImageIcon, Bookmark, Search, Bell, Settings, Shield, HelpCircle, Cloud, AlertTriangle } from 'lucide-react';"
content = re.sub(pattern, replacement, content)

with open('frontend/src/components/Layout/Sidebar.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done fixing lucide imports")
