#!/usr/bin/env python3
"""Import harness-skills into Multica via API."""
import json, os, sys, urllib.request

TOKEN = json.load(open(os.path.expanduser("~/.multica/config.json")))["token"]
WORKSPACE_ID = "5f67023e-66cb-46f0-a65f-aad3ce0e0c7a"
API = "http://localhost:8080"
SKILLS_DIR = "/mnt/FTY/harness-skills/v2.9.0/claude"

imported = 0
failed = 0
skipped = 0

for name in sorted(os.listdir(SKILLS_DIR)):
    skill_dir = os.path.join(SKILLS_DIR, name)
    skill_file = os.path.join(skill_dir, "SKILL.md")

    if not os.path.isdir(skill_dir) or not os.path.isfile(skill_file):
        continue

    with open(skill_file) as f:
        content = f.read()

    # Extract description from frontmatter
    description = f"Harness skill: {name}"
    in_frontmatter = False
    for line in content.split("\n"):
        if line.strip() == "---":
            if in_frontmatter:
                break
            in_frontmatter = True
            continue
        if in_frontmatter and line.startswith("description:"):
            description = line.split(":", 1)[1].strip()
            break

    # Collect supporting .md files
    files = []
    for root, dirs, fnames in os.walk(skill_dir):
        for fname in fnames:
            fpath = os.path.join(root, fname)
            rel = os.path.relpath(fpath, skill_dir)
            if rel == "SKILL.md":
                continue
            if not fname.endswith(".md"):
                continue
            try:
                with open(fpath) as ff:
                    files.append({"path": rel, "content": ff.read()})
            except:
                pass

    req = {
        "name": name,
        "description": description[:500],
        "content": content,
        "files": files,
    }

    data = json.dumps(req).encode()
    request = urllib.request.Request(
        f"{API}/api/skills",
        data=data,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "X-Workspace-ID": WORKSPACE_ID,
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request) as resp:
            body = json.loads(resp.read())
            file_count = len(body.get("files", []))
            print(f"  {name}: OK ({file_count} supporting files)")
            imported += 1
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()[:100]
        if "already exists" in err_body:
            print(f"  {name}: SKIPPED (already exists)")
            skipped += 1
        else:
            print(f"  {name}: FAILED ({e.code}): {err_body}")
            failed += 1

print(f"\nDone: {imported} imported, {skipped} skipped, {failed} failed")
