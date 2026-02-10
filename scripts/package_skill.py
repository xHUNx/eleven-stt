#!/usr/bin/env python3
"""
Package the ElevenLabs Speech-to-Text skill for distribution.
"""

import os
import json
import zipfile
from pathlib import Path


def package_skill(skill_dir, output_path=None):
    """
    Package the skill into a distributable ZIP file.
    
    Args:
        skill_dir (str): Path to the skill directory
        output_path (str): Output ZIP file path (optional)
    """
    skill_dir = Path(skill_dir)
    
    # Read skill manifest
    manifest_file = skill_dir / "SKILL.md"
    if not manifest_file.exists():
        raise FileNotFoundError(f"SKILL.md not found in {skill_dir}")
    
    # Get skill name from manifest
    with open(manifest_file, 'r') as f:
        content = f.read()
        
    # Extract name from YAML frontmatter
    name = "unknown"
    if content.startswith("---"):
        yaml_end = content.find("---", 3)
        if yaml_end != -1:
            yaml_content = content[3:yaml_end]
            for line in yaml_content.split('\n'):
                if line.strip().startswith('name:'):
                    name = line.split(':', 1)[1].strip().strip('"\'')
                    break
    
    # Determine output path
    if output_path is None:
        output_path = f"{name}_v0.1.1.zip"
    
    # Files to include in the package
    include_patterns = [
        "*.md",
        "package.json",
        "LICENSE",
        "scripts/*",
    ]
    
    # Create the ZIP package
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(skill_dir):
            for file in files:
                file_path = Path(root) / file
                rel_path = file_path.relative_to(skill_dir)
                
                # Include file if it matches patterns
                if (rel_path.name.endswith('.md') or 
                    rel_path.name == 'package.json' or
                    rel_path.name == 'LICENSE' or
                    str(rel_path).startswith('scripts/')):
                    
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