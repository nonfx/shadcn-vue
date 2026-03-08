---
name: shadcn-vue
description: Manages shadcn-vue components and projects -- adding, searching, fixing, debugging, styling, and composing UI. Provides project context, component docs, and usage examples. Applies when working with shadcn-vue, component registries, or any project with a components.json file.
user-invocable: false
---

# shadcn-vue

A framework for building UI, components and design systems for Vue. Components are added as source code to the user's project via the CLI.

> **IMPORTANT:** Run all CLI commands using the project's package runner: `npx shadcn-vue@latest`, `pnpm dlx shadcn-vue@latest`, or `bunx --bun shadcn-vue@latest` -- based on the project's `packageManager`. Examples below use `npx shadcn-vue@latest` but substitute the correct runner for the project.

## Current Project Context

```json
!`npx shadcn-vue@latest info --json 2>/dev/null || echo '{"error": "No shadcn-vue project found. Run shadcn-vue init first."}'`
```

The JSON above contains the project config and installed components. Use `npx shadcn-vue@latest docs <component>` to get documentation URLs for any component.

## Principles

1. **Use existing components first.** Use `npx shadcn-vue@latest search` to check registries before writing custom UI.
2. **Compose, don't reinvent.** Settings page = Tabs + Card + form controls. Dashboard = Sidebar + Card + Chart + Table.
3. **Use built-in variants before custom styles.** `variant="outline"`, `size="sm"`, etc.
4. **Use semantic colors.** `bg-primary`, `text-muted-foreground` -- never raw values like `bg-blue-500`.

## Critical Rules

These rules are **always enforced**. Each links to a file with Incorrect/Correct code pairs.

### Styling & Tailwind -> [styling.md](./rules/styling.md)

- **`class` for layout, not styling.** Never override component colors or typography.
- **No `space-x-*` or `space-y-*`.** Use `flex` with `gap-*`. For vertical stacks, `flex flex-col gap-*`.
- **Use `size-*` when width and height are equal.** `size-10` not `w-10 h-10`.
- **Use `truncate` shorthand.** Not `overflow-hidden text-ellipsis whitespace-nowrap`.
- **No manual `dark:` color overrides.** Use semantic tokens (`bg-background`, `text-muted-foreground`).
- **Use `cn()` for conditional classes.** Don't write manual template literal ternaries.
- **No manual `z-index` on overlay components.** Dialog, Sheet, Popover, etc. handle their own stacking.

### Component Structure -> [composition.md](./rules/composition.md)

- **Items always inside their Group.** `SelectItem` -> `SelectGroup`. `DropdownMenuItem` -> `DropdownMenuGroup`. `CommandItem` -> `CommandGroup`.
- **Use slots and `as-child` for custom triggers.** Vue uses Radix Vue (reka-ui) `as-child` prop.
- **Dialog, Sheet, and Drawer always need a Title.** `DialogTitle`, `SheetTitle`, `DrawerTitle` required for accessibility. Use `class="sr-only"` if visually hidden.
- **Use full Card composition.** `CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter`.
- **`TabsTrigger` must be inside `TabsList`.** Never render triggers directly in `Tabs`.
- **`Avatar` always needs `AvatarFallback`.** For when the image fails to load.

### Icons -> [icons.md](./rules/icons.md)

- **Use `lucide-vue-next` for icons.** This is the default icon library for shadcn-vue.
- **No sizing classes on icons inside components.** Components handle icon sizing via CSS.
- **Pass icons as components.** Use `<SearchIcon />`, not string lookups.

## Key Patterns

```vue
<script setup lang="ts">
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search } from 'lucide-vue-next'
</script>

<template>
  <!-- Form layout with labels -->
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-2">
      <Label for="email">Email</Label>
      <Input id="email" />
    </div>
  </div>

  <!-- Icons in buttons -->
  <Button>
    <Search class="mr-2 h-4 w-4" />
    Search
  </Button>

  <!-- Spacing: gap-*, not space-y-* -->
  <div class="flex flex-col gap-4">...</div>  <!-- correct -->
  <div class="space-y-4">...</div>            <!-- wrong -->

  <!-- Equal dimensions: size-* -->
  <Avatar class="size-10">...</Avatar>   <!-- correct -->
  <Avatar class="w-10 h-10">...</Avatar> <!-- wrong -->

  <!-- Status colors: Badge variants or semantic tokens -->
  <Badge variant="secondary">+20.1%</Badge>
</template>
```

## Component Selection

| Need                       | Use                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| Button/action              | `Button` with appropriate variant                                                                   |
| Form inputs                | `Input`, `Select`, `Combobox`, `Switch`, `Checkbox`, `RadioGroup`, `Textarea`, `PinInput`, `Slider` |
| Data display               | `Table`, `Card`, `Badge`, `Avatar`                                                                  |
| Navigation                 | `Sidebar`, `NavigationMenu`, `Breadcrumb`, `Tabs`, `Pagination`                                     |
| Overlays                   | `Dialog` (modal), `Sheet` (side panel), `Drawer` (bottom sheet), `AlertDialog` (confirmation)       |
| Feedback                   | `sonner` (toast), `Alert`, `Progress`, `Skeleton`                                                   |
| Command palette            | `Command` inside `Dialog`                                                                           |
| Charts                     | `Chart` (wraps chart libraries)                                                                     |
| Layout                     | `Card`, `Separator`, `Resizable`, `ScrollArea`, `Accordion`, `Collapsible`                          |
| Menus                      | `DropdownMenu`, `ContextMenu`, `Menubar`                                                            |
| Tooltips/info              | `Tooltip`, `HoverCard`, `Popover`                                                                   |
| Forms validation           | `vee-validate` + `zod` with `@vee-validate/zod`                                                     |

## Key Fields

The injected project context contains these key fields:

- **`aliases`** -> use the actual alias prefix for imports (e.g. `@/`, `~/`), never hardcode.
- **`tailwindVersion`** -> `"v4"` uses `@theme inline` blocks; `"v3"` uses `tailwind.config.js`.
- **`tailwindCssFile`** -> the global CSS file where custom CSS variables are defined.
- **`style`** -> component visual treatment (e.g. `new-york-v4`).
- **`resolvedPaths`** -> exact file-system destinations for components, utils, composables, etc.
- **`framework`** -> detected framework (e.g. `nuxt3`, `nuxt4`, `vite`, `laravel`).
- **`packageManager`** -> use this for any non-shadcn dependency installs.

## Workflow

1. **Get project context** -- already injected above. Run `npx shadcn-vue@latest info --json` to refresh.
2. **Check installed components first** -- before running `add`, list the `resolvedPaths.ui` directory. Don't import components that haven't been added.
3. **Find components** -- `npx shadcn-vue@latest search`.
4. **Get docs** -- run `npx shadcn-vue@latest docs <component>` to get documentation URLs.
5. **Install or update** -- `npx shadcn-vue@latest add`. When updating existing components, use `--dry-run` and `--diff` to preview changes first.
6. **Review added components** -- After adding a component, read the added files and verify they are correct. Check for missing sub-components, incorrect composition, or violations of the Critical Rules.

## Updating Components

When the user asks to update a component from upstream while keeping their local changes, use `--dry-run` and `--diff` to intelligently merge.

1. Run `npx shadcn-vue@latest add <component> --dry-run` to see all files that would be affected.
2. For each file, run `npx shadcn-vue@latest add <component> --diff <file>` to see what changed.
3. Decide per file based on the diff:
   - No local changes -> safe to overwrite.
   - Has local changes -> read the local file, analyze the diff, and apply upstream updates while preserving local modifications.
   - User says "just update everything" -> use `--overwrite`, but confirm first.
4. **Never use `--overwrite` without the user's explicit approval.**

## Quick Reference

```bash
# Initialize existing project.
npx shadcn-vue@latest init

# Add components.
npx shadcn-vue@latest add button card dialog
npx shadcn-vue@latest add --all

# Preview changes before adding/updating.
npx shadcn-vue@latest add button --dry-run
npx shadcn-vue@latest add button --diff button.vue
npx shadcn-vue@latest add button --view button.vue

# Get component docs URLs.
npx shadcn-vue@latest docs button dialog select

# View registry item details.
npx shadcn-vue@latest view button

# Project info as JSON.
npx shadcn-vue@latest info --json
```

## Detailed References

- [rules/composition.md](./rules/composition.md) -- Groups, overlays, Card, Tabs, Avatar, Alert, Toast, Separator, Skeleton, Badge
- [rules/icons.md](./rules/icons.md) -- Icon library, sizing, passing icons as components
- [rules/styling.md](./rules/styling.md) -- Semantic colors, variants, class, spacing, size, truncate, dark mode, cn(), z-index
- [cli.md](./cli.md) -- Commands, flags, dry-run, docs
- [mcp.md](./mcp.md) -- MCP server tools and configuration
