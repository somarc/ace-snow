#!/usr/bin/env bash
set -euo pipefail
umask 077

plate="${1:-}"
case "$plate" in
  a|b|c|d|e) ;;
  *) printf 'Usage: %s <a|b|c|d|e>\n' "$0" >&2; exit 64 ;;
esac

repo="$(git rev-parse --show-toplevel)"
cd "$repo"

if [[ "$plate" == 'd' || "$plate" == 'e' ]]; then
  pipeline='pipelines/ace-grok-imagine-cover.yaml'
else
  pipeline='pipelines/ace-grok-imagine-plates.yaml'
fi
self='tools/media/capture-plate.sh'
prompt="media/briefs/ace-journal-plate-${plate}.md"
grok_link="$HOME/.grok/bin/grok"
da_cli='/Users/mhess/aem/aem-code/da/da-cli/bin/da.js'

for path in "$pipeline" "$self" "$prompt" '.grok/sandbox.toml'; do
  git ls-files --error-unmatch -- "$path" >/dev/null
  git diff --quiet -- "$path"
  git diff --cached --quiet -- "$path"
done

test -x "$grok_link"
test -s "$prompt"
command -v magick >/dev/null

workspace_json="$(node "$da_cli" --org somarc --repo ace-snow workspace show --format json)"
proofs_root="$(python3 -c 'import json,sys; print(json.load(sys.stdin)["paths"]["proofs"])' <<<"$workspace_json")"
run_root="$proofs_root/ace-journal-plates-2026-08-20"
mkdir -p "$run_root/originals" "$run_root/delivery" "$run_root/receipts" "$run_root/records"

if [[ -e "$run_root/delivery/plate-${plate}.webp" ]]; then
  printf 'Refusing to overwrite existing plate: %s\n' "$run_root/delivery/plate-${plate}.webp" >&2
  exit 73
fi

tmp="$(mktemp -d "${TMPDIR:-/tmp}/ace-journal-plate-${plate}.XXXXXX")"
trap 'rm -rf "$tmp"' EXIT

grok_bin="$(python3 - "$grok_link" <<'PY'
import os
import sys
print(os.path.realpath(sys.argv[1]))
PY
)"

grok_version="$("$grok_bin" --version)"
repo_head="$(git rev-parse HEAD)"
repo_branch="$(git branch --show-current)"
prompt_sha="$(shasum -a 256 "$prompt" | awk '{print $1}')"
wrapper_sha="$(shasum -a 256 "$self" | awk '{print $1}')"
pipeline_sha="$(shasum -a 256 "$pipeline" | awk '{print $1}')"
grok_sha="$(shasum -a 256 "$grok_bin" | awk '{print $1}')"

env -i \
  HOME="$HOME" \
  PATH='/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin' \
  LANG='C' \
  "$grok_bin" \
    --cwd "$repo" \
    --sandbox ace-journal-media \
    --prompt-file "$prompt" \
    --verbatim \
    --output-format json \
    --tools image_gen \
    --disallowed-tools 'Agent,web_search,web_fetch,run_terminal_cmd,read_file,search_replace' \
    --deny 'MCPTool(*)' \
    --no-subagents \
    --disable-web-search \
    --max-turns 4 \
    --always-approve \
    > "$tmp/receipt.json"

session_id="$(python3 - "$tmp/receipt.json" <<'PY'
import json
import sys
result = json.load(open(sys.argv[1], encoding='utf-8'))
session = result.get('sessionId')
if not isinstance(session, str) or not session:
    raise SystemExit('Grok output did not contain sessionId')
print(session)
PY
)"

encoded_cwd="$(python3 - "$repo" <<'PY'
import sys
import urllib.parse
print(urllib.parse.quote(sys.argv[1], safe=''))
PY
)"
session_dir="$HOME/.grok/sessions/$encoded_cwd/$session_id"
updates="$session_dir/updates.jsonl"
test -s "$updates"
grep -Eq '"name"[[:space:]]*:[[:space:]]*"image_gen"' "$updates"

image_count="$(find "$session_dir/images" -maxdepth 1 -type f | wc -l | tr -d ' ')"
test "$image_count" -eq 1
source_image="$(find "$session_dir/images" -maxdepth 1 -type f -print | sort | head -1)"
extension="${source_image##*.}"
original="$run_root/originals/plate-${plate}-${session_id}.${extension}"
delivery="$run_root/delivery/plate-${plate}.webp"
receipt="$run_root/receipts/plate-${plate}.json"
record="$run_root/records/plate-${plate}.json"

cp -p "$source_image" "$original"
cp "$tmp/receipt.json" "$receipt"
magick "$original" -auto-orient -resize '2400x1350^' -gravity center \
  -extent 2400x1350 -quality 86 "$delivery"

original_sha="$(shasum -a 256 "$original" | awk '{print $1}')"
delivery_sha="$(shasum -a 256 "$delivery" | awk '{print $1}')"
delivery_bytes="$(stat -f '%z' "$delivery")"
dimensions="$(magick identify -format '%m %w %h' "$delivery")"
test "$dimensions" = 'WEBP 2400 1350'
test "$delivery_bytes" -le 5242880

python3 - "$record" <<PY
import json
from datetime import datetime, timezone

record = {
  'schemaVersion': 'ace-journal-plate.v1',
  'plate': '$plate',
  'recordedAt': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
  'repository': {'branch': '$repo_branch', 'head': '$repo_head'},
  'generator': {'version': '$grok_version', 'binarySha256': '$grok_sha'},
  'contracts': {
    'prompt': '$prompt',
    'promptSha256': '$prompt_sha',
    'wrapperSha256': '$wrapper_sha',
    'pipelineSha256': '$pipeline_sha',
  },
  'invocation': {
    'riverboat': True,
    'sandbox': 'ace-journal-media',
    'toolAllowlist': ['image_gen'],
    'subagents': False,
    'webSearch': False,
    'credentials': 'existing authenticated Grok session; no credential value supplied, read, printed, or copied by the wrapper',
  },
  'result': {
    'sessionId': '$session_id',
    'original': '$original',
    'originalSha256': '$original_sha',
    'delivery': '$delivery',
    'deliverySha256': '$delivery_sha',
    'deliveryBytes': int('$delivery_bytes'),
    'dimensions': {'width': 2400, 'height': 1350},
  },
  'review': {'status': 'pending-human-review'},
}
with open('$record', 'w', encoding='utf-8') as handle:
    json.dump(record, handle, indent=2, sort_keys=True)
    handle.write('\n')
PY

printf 'Plate %s captured: %s\n' "$plate" "$delivery"
