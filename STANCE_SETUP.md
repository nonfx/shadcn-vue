# Using the nonfx/shadcn-vue Fork in stance.ai

**Owner:** viz
**Last updated:** 2026-03-08

## Why This Exists

The upstream `shadcn-vue` CLI lacks agent/AI-friendly features (dry-run, diff preview, structured JSON output). We forked it to `nonfx/shadcn-vue` and added these features so Claude Code and other AI agents can safely preview and install components without side effects.

> **Core insight: The fork adds `--dry-run`, `--diff`, `--view` flags and a `docs` command — letting agents inspect changes before committing them.**

## Fork Details

| Field | Value |
|---|---|
| Upstream | `github.com/radix-vue/shadcn-vue` |
| Fork | `github.com/nonfx/shadcn-vue` |
| Branch | `feat/agent-cli-features` |
| CLI package path | `packages/cli/` |

## Installation

### Option A: GitHub dependency (recommended for CI)

In `apps/web/package.json`, add:

```json
{
  "devDependencies": {
    "shadcn-vue": "github:nonfx/shadcn-vue#feat/agent-cli-features"
  }
}
```

Then run:

```bash
bun install
```

### Option B: Local path (recommended for development)

If you have the fork cloned locally at e.g. `/Users/viz/dev/shadcn-vue`:

```bash
# Build the CLI first
cd /Users/viz/dev/shadcn-vue
/opt/homebrew/bin/node /usr/local/bin/pnpm install
/opt/homebrew/bin/node /usr/local/bin/pnpm --filter shadcn-vue build

# Then run it directly from the built output
/opt/homebrew/bin/node /Users/viz/dev/shadcn-vue/packages/cli/dist/index.js <command>
```

Or create a shell alias:

```bash
alias shadcn-vue='/opt/homebrew/bin/node /Users/viz/dev/shadcn-vue/packages/cli/dist/index.js'
```

## Node Version Requirement

The CLI requires Node 25+ (uses `node:util.styleText` via rolldown). The system default at `/usr/local/bin/node` is v18 — always use `/opt/homebrew/bin/node` (v25.5.0).

## Available Commands

### Preview changes before installing

```bash
# Show summary of what would be added/changed
shadcn-vue add button --dry-run

# Show unified diffs for all files
shadcn-vue add button --diff

# Show diffs for a specific file only
shadcn-vue add button --diff "components/ui/button"

# Show full file contents that would be written
shadcn-vue add button --view
```

### Get component documentation URLs

```bash
shadcn-vue docs button dialog table
shadcn-vue docs button --json
```

### Get project info as structured JSON

```bash
shadcn-vue info --json
```

### Standard commands (unchanged)

```bash
shadcn-vue init          # Initialize shadcn-vue in the project
shadcn-vue add <name>    # Install a component
shadcn-vue search <q>    # Search the registry
shadcn-vue diff          # Show diffs against registry
```

## Setup for stance.ai (Nuxt 4)

stance.ai uses `shadcn-nuxt` module (v2.3.1) which handles auto-imports. The CLI is used separately for adding/managing components.

1. Ensure `components.json` exists in `apps/web/` (run `shadcn-vue init` if not)
2. Run CLI commands from `apps/web/`:
   ```bash
   cd apps/web
   shadcn-vue add button --dry-run   # preview first
   shadcn-vue add button             # then install
   ```
3. Components land in `~/components/ui/` as configured by shadcn-nuxt

## MCP Server

The CLI includes an MCP server for AI tool integration:

```bash
shadcn-vue mcp
```

This exposes 7 tools: `get_project_registries`, `list_registry_items`, `search_registry`, `view_registry_item`, `get_examples`, `get_add_command`, `get_audit_checklist`.
