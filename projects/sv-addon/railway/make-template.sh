#!/usr/bin/env bash
# Builds the Railway template app from this add-on + sv-addon-railway, then (optionally) pushes it.
#
#   ./railway/make-template.sh            # build into tmp/railway-template
#   PUSH=1 ./railway/make-template.sh     # ... and force-push it to $REPO
#
# Everything is generated: never hand-edit the output, change the add-on and re-run.
set -euo pipefail

ADDON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${OUT:-$ADDON_DIR/tmp/railway-template}"
RAILWAY_ADDON="${RAILWAY_ADDON:-$ADDON_DIR/tmp/sv-addon-railway}"
REPO="${REPO:-git@github.com:jycouet/remult-sveltekit-template-railway.git}"
APP_NAME="${APP_NAME:-Remult SvelteKit}"

step() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }

step "build @remult/sv"
cd "$ADDON_DIR"
npm run build

step "sv-addon-railway (not on npm yet: clone + build)"
if [ ! -d "$RAILWAY_ADDON" ]; then
	git clone --depth 1 https://github.com/sveltejs/sv-addon-railway "$RAILWAY_ADDON"
fi
(cd "$RAILWAY_ADDON" && git pull --ff-only --quiet || true && pnpm install --silent && pnpm build >/dev/null)

step "scaffold $OUT"
rm -rf "$OUT"
mkdir -p "$(dirname "$OUT")"
npx sv create "$OUT" --types ts --template minimal --no-add-ons --no-install

step "apply add-ons"
npx sv add \
	tailwindcss=plugins:none \
	paraglide=languageTags:en,fr+demo:false \
	vitest=usages:unit \
	ai-tools=ide:claude-code+delivery:tools+tools:mcp,svelte-code-writer,svelte-core-bestpractices,svelte-file-editor+mcpSetup:remote \
	"file:$RAILWAY_ADDON=projectName:$APP_NAME+enableStyle:no" \
	"file:$ADDON_DIR=preset:full" \
	--cwd "$OUT" --no-git-check --no-download-check --no-install

step "railway config + docs"
node "$ADDON_DIR/railway/config.mjs" "$OUT" "$APP_NAME"

step "install, build, format, test"
cd "$OUT"
pnpm install --no-frozen-lockfile
pnpm exec vite build           # also generates src/lib/ROUTES.ts + paraglide output
pnpm exec kitql-lint -f
pnpm exec svelte-check --tsconfig ./tsconfig.json
pnpm exec vitest run

step "git"
rm -rf .git
git init -q -b main
git add -A
git commit -qm "Remult + SvelteKit template for Railway

Generated with @remult/sv + sv-addon-railway. Do not edit by hand: change the
add-on and re-run railway/make-template.sh."

if [ "${PUSH:-}" = "1" ]; then
	step "push to $REPO"
	git remote add origin "$REPO"
	git push --force origin main
else
	printf '\nBuilt in %s. Push with:\n  cd %s && git remote add origin %s && git push --force origin main\n' "$OUT" "$OUT" "$REPO"
fi
