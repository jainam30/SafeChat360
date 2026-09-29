import os

with open('old_chat.jsx', 'r', encoding='utf-16') as f:
    old_content = f.read()

start_marker = "    // Auto-scroll"
end_marker = "    return ("

start_idx = old_content.find(start_marker)
end_idx = old_content.find(end_marker, start_idx)

print(old_content[start_idx:end_idx])
