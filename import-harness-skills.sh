#!/usr/bin/env bash
set -euo pipefail

# Import harness-skills into Multica
TOKEN=$(python3 -c "import json; print(json.load(open('$HOME/.multica/config.json'))['token'])")
WORKSPACE_ID="5f67023e-66cb-46f0-a65f-aad3ce0e0c7a"
API="http://localhost:8080"
SKILLS_DIR="/mnt/FTY/harness-skills/v2.9.0/claude"

imported=0
failed=0

for skill_dir in "$SKILLS_DIR"/*/; do
  name=$(basename "$skill_dir")
  skill_file="$skill_dir/SKILL.md"

  # Skip if no SKILL.md
  [ -f "$skill_file" ] || continue

  echo -n "Importing $name... "

  # Read main SKILL.md
  content=$(cat "$skill_file")

  # Extract description from frontmatter (first line after ---)
  description=$(sed -n '/^---$/,/^---$/{ /^description:/{ s/^description: *//; p; q; } }' "$skill_file" 2>/dev/null || echo "Harness skill: $name")
  [ -z "$description" ] && description="Harness skill: $name"

  # Collect supporting files (everything except SKILL.md)
  files_json="[]"
  supporting_files=""

  while IFS= read -r -d '' fpath; do
    rel_path="${fpath#$skill_dir}"
    # Skip SKILL.md itself
    [ "$rel_path" = "SKILL.md" ] && continue

    file_content=$(cat "$fpath")
    # Build JSON for this file using python to handle escaping
    file_json=$(python3 -c "
import json, sys
with open(sys.argv[1], 'r') as f:
    content = f.read()
print(json.dumps({'path': sys.argv[2], 'content': content}))
" "$fpath" "$rel_path" 2>/dev/null) || continue

    if [ "$supporting_files" = "" ]; then
      supporting_files="$file_json"
    else
      supporting_files="$supporting_files,$file_json"
    fi
  done < <(find "$skill_dir" -type f -name "*.md" -print0 2>/dev/null)

  # Build the full request
  request_json=$(python3 -c "
import json, sys

with open(sys.argv[1], 'r') as f:
    content = f.read()

# Parse supporting files
files = []
skill_dir = sys.argv[2]
import os
for root, dirs, fnames in os.walk(skill_dir):
    for fname in fnames:
        fpath = os.path.join(root, fname)
        rel = os.path.relpath(fpath, skill_dir)
        if rel == 'SKILL.md':
            continue
        if not fname.endswith('.md'):
            continue
        with open(fpath, 'r') as ff:
            files.append({'path': rel, 'content': ff.read()})

desc = sys.argv[3]
name = sys.argv[4]

req = {
    'name': name,
    'description': desc[:500],
    'content': content,
    'files': files
}
print(json.dumps(req))
" "$skill_file" "$skill_dir" "$description" "$name")

  # POST to API
  response=$(curl -s -w "\n%{http_code}" -X POST "$API/api/skills" \
    -H "Authorization: Bearer $TOKEN" \
    -H "X-Workspace-ID: $WORKSPACE_ID" \
    -H "Content-Type: application/json" \
    -d "$request_json")

  http_code=$(echo "$response" | tail -1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
    file_count=$(python3 -c "import json; d=json.loads('''$body'''); print(len(d.get('files', [])))" 2>/dev/null || echo "?")
    echo "OK ($file_count supporting files)"
    imported=$((imported + 1))
  else
    echo "FAILED ($http_code): $(echo "$body" | head -c 100)"
    failed=$((failed + 1))
  fi
done

echo ""
echo "Done: $imported imported, $failed failed"
