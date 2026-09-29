import os

with open('old_chat.jsx', 'r', encoding='utf-16') as f:
    old_content = f.read()

start_marker = "    }, [activeChat, token]);"
end_marker = "    return ("

start_idx = old_content.find(start_marker)
end_idx = old_content.find(end_marker, start_idx)

if start_idx != -1 and end_idx != -1:
    missing = old_content[start_idx + len(start_marker):end_idx]
    print(missing)
