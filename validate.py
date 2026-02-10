#!/usr/bin/env python3
"""
Basic validation script for the ElevenLabs Speech-to-Text skill.
"""

import os
import json
from pathlib import Path
import re


def validate_skill_structure(skill_dir):
    """Validate that the skill has all required files."""
    skill_dir = Path(skill_dir)
    
    required_files = [
        "SKILL.md",
        "README.md", 
        "package.json",
        "LICENSE",
        "CONTRIBUTING.md",
        "scripts/package_skill.py",
        "scripts/install.sh"
    ]
    
    missing_files = []
    for file in required_files:
        if not (skill_dir / file).exists():
            missing_files.append(file)
    
    if missing_files:
        print(f"❌ Missing required files: {missing_files}")
        return False
    
    print("✅ All required files present")
    return True


def validate_skill_manifest(skill_dir):
    """Validate the skill manifest structure."""
    skill_dir = Path(skill_dir)
    manifest = skill_dir / "SKILL.md"
    
    with open(manifest, 'r') as f:
        content = f.read()
    
    # Check for YAML frontmatter
    if not content.startswith("---"):
        print("❌ Missing YAML frontmatter in SKILL.md")
        return False
    
    # Extract YAML frontmatter
    yaml_end = content.find("---", 3)
    if yaml_end == -1:
        print("❌ Invalid YAML frontmatter in SKILL.md")
        return False
    
    yaml_content = content[3:yaml_end]
    
    # Simple regex-based parsing of YAML
    name_match = re.search(r'name:\s*[\'"]?([^\'"\n]+)[\'"]?', yaml_content)
    version_match = re.search(r'version:\s*[\'"]?([^\'"\n]+)[\'"]?', yaml_content)
    description_match = re.search(r'description:\s*[\'"]?([^\'"\n]+)[\'"]?', yaml_content)
    
    if not name_match:
        print("❌ Missing name in SKILL.md")
        return False
    
    if not version_match:
        print("❌ Missing version in SKILL.md")
        return False
    
    if not description_match:
        print("❌ Missing description in SKILL.md")
        return False
    
    print(f"✅ Skill manifest valid: {name_match.group(1)} v{version_match.group(1)}")
    return True


def validate_package_json(skill_dir):
    """Validate the package.json file."""
    skill_dir = Path(skill_dir)
    pkg_file = skill_dir / "package.json"
    
    try:
        with open(pkg_file, 'r') as f:
            content = f.read()
            data = json.loads(content)
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in package.json: {e}")
        return False
    
    required_fields = ["name", "version", "description", "keywords"]
    missing_fields = []
    
    for field in required_fields:
        if field not in data:
            missing_fields.append(field)
    
    if missing_fields:
        print(f"❌ Missing required fields in package.json: {missing_fields}")
        return False
    
    print("✅ package.json valid")
    return True


def main():
    skill_dir = Path(__file__).parent
    
    print(f"Validating skill in: {skill_dir}")
    print("-" * 40)
    
    validators = [
        validate_skill_structure,
        validate_skill_manifest,
        validate_package_json
    ]
    
    all_passed = True
    for validator in validators:
        if not validator(skill_dir):
            all_passed = False
    
    print("-" * 40)
    if all_passed:
        print("🎉 All validations passed! Skill is ready for publication.")
        return 0
    else:
        print("💥 Some validations failed. Please fix the issues before publishing.")
        return 1


if __name__ == "__main__":
    exit(main())