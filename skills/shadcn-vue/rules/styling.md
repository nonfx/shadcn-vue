# Styling & Customization

## Contents

- Semantic colors
- Built-in variants first
- class for layout only
- No space-x-* / space-y-*
- Prefer size-* over w-* h-* when equal
- Prefer truncate shorthand
- No manual dark: color overrides
- Use cn() for conditional classes
- No manual z-index on overlay components

---

## Semantic colors

**Incorrect:**

```vue
<div class="bg-blue-500 text-white">
  <p class="text-gray-600">Secondary text</p>
</div>
```

**Correct:**

```vue
<div class="bg-primary text-primary-foreground">
  <p class="text-muted-foreground">Secondary text</p>
</div>
```

---

## No raw color values for status/state indicators

For positive, negative, or status indicators, use Badge variants, semantic tokens like `text-destructive`, or define custom CSS variables.

**Incorrect:**

```vue
<span class="text-emerald-600">+20.1%</span>
<span class="text-red-600">-3.2%</span>
```

**Correct:**

```vue
<Badge variant="secondary">+20.1%</Badge>
<span class="text-destructive">-3.2%</span>
```

---

## Built-in variants first

**Incorrect:**

```vue
<Button class="border border-input bg-transparent hover:bg-accent">
  Click me
</Button>
```

**Correct:**

```vue
<Button variant="outline">Click me</Button>
```

---

## class for layout only

Use `class` for layout (e.g. `max-w-md`, `mx-auto`, `mt-4`), **not** for overriding component colors or typography.

**Incorrect:**

```vue
<Card class="bg-blue-100 text-blue-900 font-bold">
  <CardContent>Dashboard</CardContent>
</Card>
```

**Correct:**

```vue
<Card class="max-w-md mx-auto">
  <CardContent>Dashboard</CardContent>
</Card>
```

---

## No space-x-* / space-y-*

Use `gap-*` instead. `space-y-4` -> `flex flex-col gap-4`. `space-x-2` -> `flex gap-2`.

```vue
<div class="flex flex-col gap-4">
  <Input />
  <Input />
  <Button>Submit</Button>
</div>
```

---

## Prefer size-* over w-* h-* when equal

`size-10` not `w-10 h-10`. Applies to icons, avatars, skeletons, etc.

---

## Prefer truncate shorthand

`truncate` not `overflow-hidden text-ellipsis whitespace-nowrap`.

---

## No manual dark: color overrides

Use semantic tokens -- they handle light/dark via CSS variables. `bg-background text-foreground` not `bg-white dark:bg-gray-950`.

---

## Use cn() for conditional classes

Use the `cn()` utility from the project for conditional or merged class names.

**Incorrect:**

```vue
<div :class="`flex items-center ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}`">
```

**Correct:**

```vue
<script setup>
import { cn } from '@/lib/utils'
</script>

<template>
  <div :class="cn('flex items-center', isActive ? 'bg-primary text-primary-foreground' : 'bg-muted')">
  </div>
</template>
```

---

## No manual z-index on overlay components

`Dialog`, `Sheet`, `Drawer`, `AlertDialog`, `DropdownMenu`, `Popover`, `Tooltip`, `HoverCard` handle their own stacking. Never add `z-50` or `z-[999]`.
