import os
import re

base_path = r"C:\Users\User\Desktop\UPAW\frontend\src\pages"

def update_imports(file_path, depth):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if depth == 2:
        content = re.sub(r"(['\"])\.\./(services|components|context|layouts|assets)", r"\1../../\2", content)
    elif depth == 3:
        content = re.sub(r"(['\"])\.\./\.\./(services|components|context|layouts|assets)", r"\1../../../\2", content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

for root, dirs, files in os.walk(base_path):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, r"C:\Users\User\Desktop\UPAW\frontend\src")
            depth = len(rel_path.split(os.sep)) - 1
            update_imports(full_path, depth)
print("Done")
