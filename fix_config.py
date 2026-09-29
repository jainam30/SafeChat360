import os

with open('frontend/src/config.js', 'r', encoding='utf-8') as f:
    content = f.read()

bad_func = '''export const getApiUrl = (path) => {
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : /;
    return ${API_URL};
};'''

good_func = '''export const getApiUrl = (path) => {
    const normalizedPath = path.startsWith('/') ? path : /;
    const url = ${API_URL};
    return url.replace(/([^:]\/)\/+/g, ""); // prevent double slashes like https://domain.com//api
};'''

content = content.replace(bad_func, good_func)
with open('frontend/src/config.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed config.js")
