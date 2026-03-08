import type { z } from 'zod'
import type { registryResolvedItemsTreeSchema } from '@/src/schema'
import type { Config } from '@/src/utils/get-config'
import { existsSync, promises as fs } from 'node:fs'
import path from 'pathe'
import { getRegistryBaseColor } from '@/src/registry/api'
import { configWithDefaults } from '@/src/registry/config'
import { resolveRegistryTree } from '@/src/registry/resolver'
import { isContentSame } from '@/src/utils/compare'
import { isEnvFile } from '@/src/utils/env-helpers'
import { getProjectInfo } from '@/src/utils/get-project-info'
import { transform } from '@/src/utils/transformers'
import { transformCss } from '@/src/utils/updaters/update-css'
import { transformCssVars } from '@/src/utils/updaters/update-css-vars'
import {
  findCommonRoot,
  resolveFilePath,
} from '@/src/utils/updaters/update-files'

export interface DryRunFile {
  path: string
  action: 'create' | 'overwrite' | 'skip'
  content: string
  existingContent?: string
  type: string
}

export interface DryRunCss {
  path: string
  content: string
  existingContent?: string
  action: 'create' | 'update'
  cssVarsCount: number
}

export interface DryRunEnvVars {
  path: string
  variables: Record<string, string>
  action: 'create' | 'update'
}

export interface DryRunResult {
  files: DryRunFile[]
  dependencies: string[]
  devDependencies: string[]
  css: DryRunCss | null
  envVars: DryRunEnvVars | null
  docs: string | null
}

export async function dryRunComponents(
  components: string[],
  config: Config,
  options: {
    overwrite?: boolean
    overwriteCssVars?: boolean
  } = {},
) {
  const result: DryRunResult = {
    files: [],
    dependencies: [],
    devDependencies: [],
    css: null,
    envVars: null,
    docs: null,
  }

  if (!components.length) {
    return result
  }

  const tree = await resolveRegistryTree(components, configWithDefaults(config))

  if (!tree) {
    throw new Error('Failed to fetch components from registry.')
  }

  result.dependencies = Array.from(new Set(tree.dependencies ?? []))
  result.devDependencies = Array.from(new Set(tree.devDependencies ?? []))
  result.docs = tree.docs ?? null

  await processFiles(tree, config, result)
  await processCss(tree, config, result, options)
  processEnvVars(tree, config, result)

  return result
}

async function processFiles(
  tree: z.infer<typeof registryResolvedItemsTreeSchema>,
  config: Config,
  result: DryRunResult,
) {
  const files = tree.files
  if (!files?.length) {
    return
  }

  const [projectInfo, baseColor] = await Promise.all([
    getProjectInfo(config.resolvedPaths.cwd),
    config.tailwind.baseColor
      ? getRegistryBaseColor(config.tailwind.baseColor)
      : Promise.resolve(undefined),
  ])

  for (let index = 0; index < files.length; index++) {
    const file = files[index]
    if (!file.content) {
      continue
    }

    let filePath = resolveFilePath(file, config, {
      framework: projectInfo?.framework.name,
      commonRoot: findCommonRoot(
        files.map(f => f.path),
        file.path,
      ),
      fileIndex: index,
    })

    if (!filePath) {
      continue
    }

    if (!config.typescript) {
      filePath = filePath.replace(/\.ts?$/, () => '.js')
    }

    const existingFile = existsSync(filePath)
    const relativePath = path.relative(config.resolvedPaths.cwd, filePath)

    const content = isEnvFile(filePath)
      ? file.content
      : await transform({
          filename: file.path,
          raw: file.content,
          config,
          baseColor,
          isRemote: false,
        })

    let action: DryRunFile['action'] = 'create'
    let oldContent: string | undefined
    if (existingFile) {
      oldContent = await fs.readFile(filePath, 'utf-8')
      if (isContentSame(oldContent, content)) {
        action = 'skip'
      }
      else {
        action = 'overwrite'
      }
    }

    result.files.push({
      path: relativePath,
      action,
      content,
      ...(action === 'overwrite' && { existingContent: oldContent }),
      type: file.type ?? 'registry:ui',
    })
  }
}

async function processCss(
  tree: z.infer<typeof registryResolvedItemsTreeSchema>,
  config: Config,
  result: DryRunResult,
  options: { overwriteCssVars?: boolean },
) {
  const hasCss = tree.css && Object.keys(tree.css).length > 0
  const hasCssVars = Object.keys(tree.cssVars ?? {}).length > 0

  if (!config.resolvedPaths.tailwindCss || (!hasCss && !hasCssVars)) {
    return
  }

  const cssFilepath = config.resolvedPaths.tailwindCss
  const existingFile = existsSync(cssFilepath)
  const relativePath = path.relative(config.resolvedPaths.cwd, cssFilepath)

  const existingContent = existingFile
    ? await fs.readFile(cssFilepath, 'utf8')
    : ''
  let output = existingContent

  if (hasCssVars) {
    output = await transformCssVars(output, tree.cssVars!, config, {
      overwriteCssVars: options.overwriteCssVars,
    })
  }

  if (hasCss) {
    output = await transformCss(output, tree.css!)
  }

  let cssVarsCount = 0
  if (tree.cssVars) {
    for (const vars of Object.values(tree.cssVars)) {
      if (vars) {
        cssVarsCount += Object.keys(vars).length
      }
    }
  }

  result.css = {
    path: relativePath,
    content: output,
    ...(existingFile && { existingContent }),
    action: existingFile ? 'update' : 'create',
    cssVarsCount,
  }
}

function processEnvVars(
  tree: z.infer<typeof registryResolvedItemsTreeSchema>,
  config: Config,
  result: DryRunResult,
) {
  if (!tree.envVars || Object.keys(tree.envVars).length === 0) {
    return
  }

  const envFilePath = path.join(config.resolvedPaths.cwd, '.env.local')
  const existingFile = existsSync(envFilePath)
  const relativePath = path.relative(config.resolvedPaths.cwd, envFilePath)

  result.envVars = {
    path: relativePath,
    variables: tree.envVars,
    action: existingFile ? 'update' : 'create',
  }
}
