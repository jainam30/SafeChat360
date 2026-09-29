import os

with open('old_chat.jsx', 'r', encoding='utf-16') as f:
    old_content = f.read()

start_marker = "    }, [activeChat, token]);"
end_marker = "    return ("

start_idx = old_content.find(start_marker)
end_idx = old_content.find(end_marker, start_idx)

if start_idx != -1 and end_idx != -1:
    missing_functions = old_content[start_idx + len(start_marker):end_idx]
    
    with open('frontend/src/pages/Chat.jsx', 'r', encoding='utf-8') as f:
        new_content = f.read()
    
    insert_marker = "    return ("
    insert_idx = new_content.find(insert_marker)
    
    if insert_idx != -1:
        final_content = new_content[:insert_idx] + missing_functions + new_content[insert_idx:]
        with open('frontend/src/pages/Chat.jsx', 'w', encoding='utf-8') as f:
            f.write(final_content)
        print("Restored missing functions!")
    else:
        print("Could not find insert marker in new_content")
else:
    print("Could not find start or end marker in old_content")
