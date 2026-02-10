#!/usr/bin/env python3
"""
Package the ElevenLabs Speech-to-Text skill for distribution.
"""

import os
import zipfile
from pathlib import Path


def package_skill(skill_dir, output_path=None):
    skill_dir = Path(skill_dir)

    manifest_file = skill_dir / "SKILL.md"
    if not manifest_file.exists():
        raise FileNotFoundError(f"SKILL.md not found in {skill_dir}")

    with open(manifest_file, 'r') as f:
        content = f.read()

    name = "unknown"
    if content.startswith("---"):
        yaml_end = content.find("---", 3)
        if yaml_end != -1:
            yaml_content = content[3:yaml_end]
            for line in yaml_content.split('\n'):
                if line.strip().startswith('name:'):
                    name = line.split(':', 1)[1].strip().strip('"\'')
                    break

    if output_path is None:
        output_path = f"{name}_v0.2.0.zip"

    allowed_files = {
        'README.md',
        'SKILL.md',
        'LICENSE',
        'CONTRIBUTING.md',
        'PUBLISHING_CHECKLIST.md',
        'package.json',
        '.gitignore',
        'setup_github.sh',
    }

    allowed_dirs = {'src/', 'scripts/'}

    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(skill_dir):
            for file in files:
                file_path = Path(root) / file
                rel_path = file_path.relative_to(skill_dir)
                rel_str = str(rel_path)

                if rel_str in allowed_files or any(rel_str.startswith(prefix) for prefix in allowed_dirs):
                    zipf.write(file_path, arcname=rel_path)

    print(f"Skill packaged successfully: {output_path}")
    print(f"Package size: {os.path.getsize(output_path)} bytes")


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python package_skill.py <skill_directory> [output_path]")
        sys.exit(1)

    skill_dir = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None

    try:
        package_skill(skill_dir, output_path)
    except Exception as e:
        print(f"Error packaging skill: {e}")
        sys.exit(1)
