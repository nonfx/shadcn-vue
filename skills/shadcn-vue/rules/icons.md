# Icons

**Use `lucide-vue-next` for icons.** This is the default icon library for shadcn-vue. Check the project's configuration if a different icon library is used.

---

## Icons in Vue components

Import icons from `lucide-vue-next` and use them as components:

```vue
<script setup>
import { Search, ArrowRight } from 'lucide-vue-next'
</script>

<template>
  <Button>
    <Search class="mr-2 h-4 w-4" />
    Search
  </Button>

  <Button>
    Next
    <ArrowRight class="ml-2 h-4 w-4" />
  </Button>
</template>
```

---

## Pass icons as component objects, not string keys

**Incorrect:**

```vue
<script setup>
const iconMap = {
  check: CheckIcon,
  alert: AlertIcon,
}

const props = defineProps<{ icon: string }>()
</script>

<template>
  <component :is="iconMap[props.icon]" />
</template>
```

**Correct:**

```vue
<script setup>
import type { Component } from 'vue'

const props = defineProps<{ icon: Component }>()
</script>

<template>
  <component :is="props.icon" />
</template>
```

Usage:

```vue
<script setup>
import { Check } from 'lucide-vue-next'
</script>

<template>
  <StatusBadge :icon="Check" />
</template>
```
