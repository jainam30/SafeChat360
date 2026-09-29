import os

with open('frontend/src/pages/Chat.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

bad_str = "        socket.addEventListener('message', handleMessage);\n            <div className=\"flex h-full w-full bg-white overflow-hidden text-slate-900 font-sans\">"
good_str = """        socket.addEventListener('message', handleMessage);

        return () => {
            socket.removeEventListener('message', handleMessage);
        };
    }, [socket, activeChat, token]);

    return (
        <div className="flex h-full w-full bg-white overflow-hidden text-slate-900 font-sans">"""

if bad_str in content:
    content = content.replace(bad_str, good_str)
    with open('frontend/src/pages/Chat.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed missing useEffect closure and return statement!")
else:
    print("Could not find the exact bad string. Let me try regex.")
    import re
    # Match the addEventListener followed by the div
    pattern = r"socket\.addEventListener\('message',\s*handleMessage\);\s*<div className=\"flex h-full w-full bg-white overflow-hidden text-slate-900 font-sans\">"
    if re.search(pattern, content):
        content = re.sub(pattern, good_str.strip(), content)
        with open('frontend/src/pages/Chat.jsx', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Fixed using regex!")
    else:
        print("Still couldn't find it.")
