import os
import re

directories_to_check = [
    r"C:\Users\GU\.gemini\config\skills",
    r"C:\Users\GU\.agents\skills",
    r"e:\AI\Antigravity\小红书\.agent\skills"
]

folder_to_name = {}

# Parse SKILL.md in all directories
for base_dir in directories_to_check:
    if not os.path.exists(base_dir):
        continue
    for folder_name in os.listdir(base_dir):
        folder_path = os.path.join(base_dir, folder_name)
        if os.path.isdir(folder_path):
            skill_md_path = os.path.join(folder_path, "SKILL.md")
            if os.path.exists(skill_md_path):
                with open(skill_md_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    # Find 'name: <name>' in YAML frontmatter
                    match = re.search(r'^---\s*[\s\S]*?\nname:\s*"?([\w-]+)"?\s*\n', content, re.MULTILINE)
                    if match:
                        true_name = match.group(1)
                        folder_to_name[folder_name] = true_name

# Now update the markdown file
md_file_path = r"C:\Users\GU\.gemini\config\skills\AVAILABLE_SKILLS.md"
with open(md_file_path, 'r', encoding='utf-8') as f:
    md_content = f.read()

def replace_folder_name(match):
    matched_folder = match.group(1)
    if matched_folder in folder_to_name:
        true_name = folder_to_name[matched_folder]
        # We also need to update the prompt if the folder name is mentioned in the prompt text
        return f"- 🛠️ **`{true_name}`**"
    return match.group(0)

# Pattern to match `- 🛠️ **`folder_name`**`
md_content = re.sub(r'- 🛠️ \*\*`([^`]+)`\*\*', replace_folder_name, md_content)

# We should also replace mentions of the folder name in the "调用唤醒词" section.
# e.g., "用 resume-cover-letter-writer 帮我写一封求职信。"
# If folder_name is found in the trigger sentence, replace it with true_name.
for folder_name, true_name in folder_to_name.items():
    if folder_name != true_name:
        # Avoid replacing common words if folder_name is too generic. Usually folder_name is specific enough.
        # Use word boundaries if possible, but folder_name might have dashes.
        # Safe replacement: replace occurrences of `folder_name` only when it's not part of another word.
        # We can use regex with lookaround or \b, but since python's \b works on word characters (including dashes? No, dash is not word character).
        pattern = r'(?<![a-zA-Z0-9_-])' + re.escape(folder_name) + r'(?![a-zA-Z0-9_-])'
        md_content = re.sub(pattern, true_name, md_content)

with open(md_file_path, 'w', encoding='utf-8') as f:
    f.write(md_content)

print(f"Updated skills. Replacements made: {len(folder_to_name)}")
print("Mapping used:")
for k, v in folder_to_name.items():
    if k != v:
        print(f"{k} -> {v}")
