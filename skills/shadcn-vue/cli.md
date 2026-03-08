# shadcn-vue CLI Reference

Configuration is read from `components.json`.

> **IMPORTANT:** Always run commands using the project's package runner: `npx shadcn-vue@latest`, `pnpm dlx shadcn-vue@latest`, or `bunx --bun shadcn-vue@latest`. Check `packageManager` from project context to choose the right one.

> **IMPORTANT:** Only use the flags documented below. Do not invent or guess flags -- if a flag isn't listed here, it doesn't exist.

## Commands

### `init` -- Initialize a project

```bash
npx shadcn-vue@latest init [options]
```

Initializes shadcn-vue in an existing project.

| Flag          | Short | Description                          | Default |
| ------------- | ----- | ------------------------------------ | ------- |
| `--yes`       | `-y`  | Skip confirmation prompt             | `true`  |
| `--defaults`  | `-d`  | Use defaults                         | `false` |
| `--force`     | `-f`  | Force overwrite existing config      | `false` |
| `--cwd <cwd>` | `-c` | Working directory                    | current |
| `--silent`    | `-s`  | Mute output                          | `false` |

### `add` -- Add components

```bash
npx shadcn-vue@latest add [components...] [options]
```

Accepts component names, registry-prefixed names, URLs, or local paths.

| Flag            | Short | Description                                              | Default |
| --------------- | ----- | -------------------------------------------------------- | ------- |
| `--yes`         | `-y`  | Skip confirmation prompt                                 | `false` |
| `--overwrite`   | `-o`  | Overwrite existing files                                 | `false` |
| `--cwd <cwd>`   | `-c` | Working directory                                        | current |
| `--all`         | `-a`  | Add all available components                             | `false` |
| `--path <path>` | `-p` | Target path for the component                            | --      |
| `--silent`      | `-s`  | Mute output                                              | `false` |
| `--dry-run`     |       | Preview all changes without writing files                | `false` |
| `--diff [path]` |       | Show diffs (implies `--dry-run`)                         | --      |
| `--view [path]` |       | Show file contents (implies `--dry-run`)                 | --      |

#### Dry-Run Mode

Use `--dry-run` to preview what `add` would do without writing any files. `--diff` and `--view` both imply `--dry-run`.

```bash
# Preview all changes.
npx shadcn-vue@latest add button --dry-run

# Show diffs for all files (top 5).
npx shadcn-vue@latest add button --diff

# Show the diff for a specific file.
npx shadcn-vue@latest add button --diff Button.vue

# Show contents for all files (top 5).
npx shadcn-vue@latest add button --view

# Show the full content of a specific file.
npx shadcn-vue@latest add button --view Button.vue

# CSS diffs.
npx shadcn-vue@latest add button --diff app.css
```

**When to use dry-run:**

- When the user asks "what files will this add?" or "what will this change?" -- use `--dry-run`.
- Before overwriting existing components -- use `--diff` to preview the changes first.
- When the user wants to inspect component source code without installing -- use `--view`.
- When checking what CSS changes would be made -- use `--diff app.css`.

### `docs` -- Get component documentation URLs

```bash
npx shadcn-vue@latest docs <components...> [options]
```

Outputs resolved URLs for component documentation. Accepts one or more component names.

| Flag          | Short | Description       | Default |
| ------------- | ----- | ----------------- | ------- |
| `--cwd <cwd>` | `-c` | Working directory | current |
| `--json`      |       | Output as JSON    | `false` |

### `search` -- Search registries

```bash
npx shadcn-vue@latest search [options]
```

Search across registries for components.

### `view` -- View item details

```bash
npx shadcn-vue@latest view <items...> [options]
```

Displays item info including file contents.

### `diff` -- Check for updates

```bash
npx shadcn-vue@latest diff [component] [options]
```

Compare local components against the registry.

### `info` -- Project information

```bash
npx shadcn-vue@latest info [options]
```

Displays project info and `components.json` configuration.

| Flag          | Short | Description       | Default |
| ------------- | ----- | ----------------- | ------- |
| `--cwd <cwd>` | `-c` | Working directory | current |
| `--json`      |       | Output as JSON    | `false` |

**Project Info fields:**

| Field                | Type      | Meaning                                              |
| -------------------- | --------- | ---------------------------------------------------- |
| `framework`          | `object`  | Detected framework (`nuxt3`, `nuxt4`, `vite`, etc.) |
| `typescript`         | `boolean` | Whether the project uses TypeScript                  |
| `tailwindVersion`    | `string`  | `"v3"` or `"v4"`                                     |
| `tailwindConfigFile` | `string`  | Path to the Tailwind config file                     |
| `tailwindCssFile`    | `string`  | Path to the global CSS file                          |
| `aliasPrefix`        | `string`  | Import alias prefix (e.g. `@`, `~`)                 |

**Components.json fields:**

| Field                    | Type     | Meaning                                            |
| ------------------------ | -------- | -------------------------------------------------- |
| `style`                  | `string` | Visual style (e.g. `new-york-v4`)                  |
| `typescript`             | `boolean`| TypeScript flag                                    |
| `tailwind.config`        | `string` | Tailwind config path                               |
| `tailwind.css`           | `string` | Global CSS path                                    |
| `aliases.components`     | `string` | Component import alias                             |
| `aliases.utils`          | `string` | Utils import alias                                 |
| `aliases.ui`             | `string` | UI component alias                                 |
| `aliases.lib`            | `string` | Lib alias                                          |
| `aliases.composables`    | `string` | Composables alias                                  |
| `resolvedPaths`          | `object` | Absolute file-system paths for each alias          |
| `registries`             | `object` | Configured custom registries                       |

### `build` -- Build a custom registry

```bash
npx shadcn-vue@latest build [registry] [options]
```

Builds `registry.json` into individual JSON files for distribution.

| Flag              | Short | Description       | Default      |
| ----------------- | ----- | ----------------- | ------------ |
| `--output <path>` | `-o`  | Output directory  | `./public/r` |
| `--cwd <cwd>`     | `-c`  | Working directory | current      |

### `migrate` -- Migrate project

```bash
npx shadcn-vue@latest migrate [options]
```

Migrate your project configuration and components.

### `mcp` -- MCP server

```bash
npx shadcn-vue@latest mcp        # start the MCP server (stdio)
npx shadcn-vue@latest mcp init   # write config for your editor
```

See [mcp.md](./mcp.md) for details.
