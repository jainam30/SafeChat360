import os

with open('old_chat.jsx', 'r', encoding='utf-16') as f:
    old_content = f.read()

start_marker = "    // Auto-scroll"
end_marker = "    return (\n        <div className=\"flex h-full w-full mx-auto"

start_idx = old_content.find(start_marker)
end_idx = old_content.find(end_marker, start_idx)

if start_idx != -1 and end_idx != -1:
    funcs_to_inject = old_content[start_idx:end_idx]
    
    with open('frontend/src/pages/Chat.jsx', 'r', encoding='utf-8') as f:
        new_content = f.read()
    
    insert_marker = "    return (\n        <div className=\"flex h-full w-full bg-white"
    insert_idx = new_content.find(insert_marker)
    
    if insert_idx != -1:
        final_content = new_content[:insert_idx] + funcs_to_inject + new_content[insert_idx:]
        with open('frontend/src/pages/Chat.jsx', 'w', encoding='utf-8') as f:
            f.write(final_content)
        print("Restored ALL missing functions cleanly!")
    else:
        print("Could not find insert marker in new_content")
else:
    print("Could not find start or end marker in old_content")
