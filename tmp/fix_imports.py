import os
import re

def replace_in_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    # Fix 'types' to 'Types'
    new_content = re.sub(r"from '(\.\.?/\.\.?/)+logic/core/types'", lambda m: m.group(0).replace('types', 'Types'), new_content)
    new_content = re.sub(r"from \"(\.\.?/\.\.?/)+logic/core/types\"", lambda m: m.group(0).replace('types', 'Types'), new_content)
    
    # Fix 'uiTranslations' to 'UiTranslations'
    new_content = re.sub(r"from '(\.\.?/\.\.?/)*lib/uiTranslations'", lambda m: m.group(0).replace('uiTranslations', 'UiTranslations'), new_content)
    new_content = re.sub(r"from \"(\.\.?/\.\.?/)*lib/uiTranslations\"", lambda m: m.group(0).replace('uiTranslations', 'UiTranslations'), new_content)
    
    # Simple versions too
    new_content = re.sub(r"from '../logic/core/types'", "from '../logic/core/Types'", new_content)
    new_content = re.sub(r"from '../../logic/core/types'", "from '../../logic/core/Types'", new_content)
    new_content = re.sub(r"from '../lib/uiTranslations'", "from '../lib/UiTranslations'", new_content)
    new_content = re.sub(r"from '../../lib/uiTranslations'", "from '../../lib/UiTranslations'", new_content)
    
    if content != new_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {file_path}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            replace_in_file(os.path.join(root, file))
