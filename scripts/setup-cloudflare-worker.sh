#!/usr/bin/env bash
# Setup Cloudflare Workers deployment for a SvelteKit project.
#
# This script documents the deployment architecture and can be used
# as a reference when initializing a new repo with the same pattern.
#
# Architecture:
#   - SvelteKit builds with @sveltejs/adapter-cloudflare
#   - GitHub Actions runs `vite build` then `wrangler deploy` on push to main
#   - Wrangler serves the Worker from .svelte-kit/cloudflare/
#   - No Cloudflare Pages project needed (Workers + static assets only)
#
# Prerequisites:
#   - Cloudflare account with Workers enabled
#   - GitHub repo secrets: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
#   - wrangler.toml configured (see below)
#
# Common pitfalls:
#   - Do NOT create a Cloudflare Pages project for this repo. Pages expects
#     static output in build/index.html, but adapter-cloudflare outputs to
#     .svelte-kit/cloudflare/. If a Pages project exists alongside the Worker,
#     it will auto-build on push and fail with:
#       "build/index.html not found. Run "vite build" first."
#     Delete the Pages project from CF dashboard; Workers handles everything.
#
#   - If using adapter-static for Vercel alongside adapter-cloudflare,
#     conditionally select the adapter in svelte.config.js:
#       const useStatic = !!process.env.VERCEL;
#     This ensures Vercel gets build/ output and CF gets .svelte-kit/cloudflare/.
#
#   - Disconnect Vercel's GitHub integration if no longer deploying there,
#     otherwise Vercel will create stale deployment records on every push.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Cloudflare Workers Deployment Setup ==="
echo ""

# Check for wrangler.toml
if [ ! -f "$PROJECT_DIR/wrangler.toml" ]; then
  cat <<'TOML' > "$PROJECT_DIR/wrangler.toml"
name = "my-worker"
main = ".svelte-kit/cloudflare/_worker.js"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]
workers_dev = true

[observability.logs]
enabled = true
invocation_logs = true

[assets]
binding = "ASSETS"
directory = ".svelte-kit/cloudflare"
TOML
  echo "[created] wrangler.toml"
else
  echo "[exists]  wrangler.toml"
fi

# Check for GitHub Actions workflow
WORKFLOW_DIR="$PROJECT_DIR/.github/workflows"
WORKFLOW_FILE="$WORKFLOW_DIR/deploy-cloudflare.yml"

if [ ! -f "$WORKFLOW_FILE" ]; then
  mkdir -p "$WORKFLOW_DIR"
  cat <<'YAML' > "$WORKFLOW_FILE"
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - run: bun install

      - run: bun run -- vite build

      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
YAML
  echo "[created] $WORKFLOW_FILE"
else
  echo "[exists]  $WORKFLOW_FILE"
fi

# Check svelte.config.js for adapter-cloudflare
if grep -q "adapter-cloudflare" "$PROJECT_DIR/svelte.config.js" 2>/dev/null; then
  echo "[ok]      svelte.config.js uses adapter-cloudflare"
else
  echo "[warn]    svelte.config.js does not reference adapter-cloudflare"
  echo "          Install: bun add -d @sveltejs/adapter-cloudflare"
fi

echo ""
echo "Required GitHub repo secrets:"
echo "  CLOUDFLARE_API_TOKEN   - API token with Workers write permission"
echo "  CLOUDFLARE_ACCOUNT_ID  - Your Cloudflare account ID"
echo ""
echo "To deploy manually:  bun run -- vite build && npx wrangler deploy"
echo "To add custom domain: add routes[] to wrangler.toml"
echo ""
echo "Done."
