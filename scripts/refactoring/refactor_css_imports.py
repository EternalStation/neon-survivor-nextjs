import os
import re

replacements = {
    r'/animations\.css(?=[\'"])': '/Animations.css',
    r'/index\.css(?=[\'"])': '/Index.css',
    r'/menu_additions\.css(?=[\'"])': '/MenuAdditions.css',
}

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for pattern, replacement in replacements.items():
        new_content = re.sub(pattern, replacement, new_content)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file_path}")

root_dir = r'c:\Users\trohi\Desktop\neon-survivor-nextjs\src'
for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.css')):
            process_file(os.path.join(root, file))
