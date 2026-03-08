import type { DryRunFile, DryRunResult } from '@/src/utils/dry-run'
import { colors } from 'consola/utils'
import { diffWords, structuredPatch } from 'diff'

const { bold, cyan, dim, green, red, yellow } = colors

const MAX_OVERVIEW_FILES = 5

const BOX_TOP = dim(`┌${'─'.repeat(46)}`)
const BOX_BOTTOM = dim(`└${'─'.repeat(46)}`)

const ACTION_GLYPHS: Record<DryRunFile['action'], string> = {
  create: '+',
  overwrite: '~',
  skip: '=',
}

const ACTION_LABELS: Record<DryRunFile['action'], string> = {
  create: 'create',
  overwrite: 'overwrite',
  skip: 'skip (identical)',
}

function colorAction(action: DryRunFile['action'] | 'update') {
  if (action === 'create')
    return green(action)
  if (action === 'overwrite' || action === 'update')
    return yellow(action)
  return dim(action)
}

function formatHeader(componentNames: string[]) {
  return `${bold('┌')} ${bold(`shadcn-vue add ${componentNames.join(', ')}`)} ${dim(
    '(dry run)',
  )}`
}

function matchesCssPath(cssPath: string, filterPath: string) {
  return (
    cssPath === filterPath
    || cssPath.includes(filterPath)
    || cssPath.endsWith(filterPath)
  )
}

function pushContentBox(
  lines: string[],
  contentLines: string[],
  formatLine: (line: string) => string = l => l,
) {
  lines.push(`${dim('│')} ${BOX_TOP}`)
  for (const line of contentLines) {
    lines.push(`${dim('│')} ${dim('│')} ${formatLine(line)}`)
  }
  lines.push(`${dim('│')} ${BOX_BOTTOM}`)
}

export function formatDryRunResult(
  result: DryRunResult,
  componentNames: string[],
  options: {
    diff?: string | true
    view?: string | true
  } = {},
) {
  if (options.diff) {
    if (typeof options.diff === 'string') {
      return formatDiffOutput(result, componentNames, options.diff)
    }
    return formatDiffOverview(result, componentNames)
  }

  if (options.view) {
    if (typeof options.view === 'string') {
      return formatViewOutput(result, componentNames, options.view)
    }
    return formatViewOverview(result, componentNames)
  }

  return formatSummaryOutput(result, componentNames)
}

function formatSummaryOutput(result: DryRunResult, componentNames: string[]) {
  const lines: string[] = []

  lines.push(formatHeader(componentNames))
  lines.push(dim('│'))

  formatFilesSection(result, lines)
  formatListSection('Dependencies', result.dependencies, lines)
  formatListSection('Dev Dependencies', result.devDependencies, lines)
  formatCssSection(result, lines)
  formatEnvVarsSection(result, lines)

  const overwriteCount = result.files.filter(
    f => f.action === 'overwrite',
  ).length
  if (overwriteCount > 0) {
    lines.push(
      yellow(
        `⚠ ${overwriteCount} ${
          overwriteCount === 1 ? 'file' : 'files'
        } will be overwritten.`,
      ),
    )
    lines.push(dim('│'))
  }

  const summaryParts: string[] = []
  if (result.files.length > 0) {
    summaryParts.push(
      `${result.files.length} ${result.files.length === 1 ? 'file' : 'files'}`,
    )
  }
  if (result.dependencies.length > 0) {
    summaryParts.push(
      `${result.dependencies.length} ${
        result.dependencies.length === 1 ? 'dep' : 'deps'
      }`,
    )
  }
  if (result.css?.cssVarsCount) {
    summaryParts.push(`${result.css.cssVarsCount} CSS vars`)
  }
  if (summaryParts.length > 0) {
    lines.push(`${dim('│')} ${dim(summaryParts.join(', '))}`)
    lines.push(dim('│'))
  }

  lines.push(`${dim('│')} ${dim('Run with --diff to view changes.')}`)
  lines.push(`${dim('│')} ${dim('Run with --view to view file contents.')}`)
  lines.push(`${dim('└')} ${dim('Run without --dry-run to apply.')}`)

  return lines.join('\n')
}

function formatDiffOutput(
  result: DryRunResult,
  componentNames: string[],
  filterPath: string,
) {
  const lines: string[] = []

  lines.push(formatHeader(componentNames))
  lines.push(dim('│'))

  const filesToDiff = resolveFilterPath(result.files, filterPath)
  const cssMatch = result.css && matchesCssPath(result.css.path, filterPath)

  if (filesToDiff.length === 0 && !cssMatch) {
    lines.push(
      `${dim('│')} ${yellow(`No file matching "${filterPath}" found.`)}`,
    )
    lines.push(dim('│'))
  }
  else {
    for (const file of filesToDiff) {
      formatFileDiff(file, lines)
    }

    if (cssMatch && result.css) {
      lines.push(
        `${dim('├')} ${bold(result.css.path)} ${dim('(')}${colorAction(
          result.css.action,
        )}${dim(')')}`,
      )

      if (result.css.action === 'create' || !result.css.existingContent) {
        pushContentBox(lines, result.css.content.split('\n'), l =>
          green(`+${l}`))
      }
      else {
        const diffLines = computeUnifiedDiff(
          result.css.existingContent,
          result.css.content,
          result.css.path,
          { fullContext: true },
        )
        pushContentBox(lines, diffLines)
      }

      lines.push(dim('│'))
    }
  }

  lines.push(`${dim('└')} ${dim('Run without --dry-run to apply.')}`)

  return lines.join('\n')
}

function formatDiffOverview(result: DryRunResult, componentNames: string[]) {
  const lines: string[] = []

  lines.push(formatHeader(componentNames))
  lines.push(dim('│'))

  const filesToDiff = result.files.slice(0, MAX_OVERVIEW_FILES)

  if (filesToDiff.length === 0 && !result.css) {
    lines.push(`${dim('│')} ${dim('No changes.')}`)
    lines.push(dim('│'))
  }
  else {
    for (const file of filesToDiff) {
      formatFileDiff(file, lines)
    }

    const total = result.files.length
    if (total > MAX_OVERVIEW_FILES) {
      lines.push(dim('│'))
    }
  }

  const total = result.files.length
  if (total > MAX_OVERVIEW_FILES) {
    lines.push(
      `  ${dim(
        `Showing ${MAX_OVERVIEW_FILES} of ${total} files. Use --diff <path> to view a specific file.`,
      )}`,
    )
  }

  lines.push(`${dim('└')} ${dim('Run without --dry-run to apply.')}`)

  return lines.join('\n')
}

function formatViewOverview(result: DryRunResult, componentNames: string[]) {
  const lines: string[] = []

  lines.push(formatHeader(componentNames))
  lines.push(dim('│'))

  const filesToView = result.files.slice(0, MAX_OVERVIEW_FILES)

  if (filesToView.length === 0 && !result.css) {
    lines.push(`${dim('│')} ${dim('No files.')}`)
    lines.push(dim('│'))
  }
  else {
    for (const file of filesToView) {
      const contentLines = file.content.split('\n')
      lines.push(
        `${dim('├')} ${bold(file.path)} ${dim('(')}${colorAction(
          file.action,
        )}${dim(')')} ${dim(`${contentLines.length} lines`)}`,
      )
      pushContentBox(lines, contentLines)
      lines.push(dim('│'))
    }

    const total = result.files.length
    if (total > MAX_OVERVIEW_FILES) {
      lines.push(dim('│'))
    }
  }

  const total = result.files.length
  if (total > MAX_OVERVIEW_FILES) {
    lines.push(
      `  ${dim(
        `Showing ${MAX_OVERVIEW_FILES} of ${total} files. Use --view <path> to view a specific file.`,
      )}`,
    )
  }

  lines.push(`${dim('└')} ${dim('Run without --dry-run to apply.')}`)

  return lines.join('\n')
}

function formatFileDiff(file: DryRunFile, lines: string[]) {
  lines.push(
    `${dim('├')} ${bold(file.path)} ${dim('(')}${colorAction(file.action)}${dim(
      ')',
    )}`,
  )

  if (file.action === 'skip') {
    lines.push(`${dim('│')} ${dim('No changes.')}`)
  }
  else if (file.action === 'create') {
    pushContentBox(lines, file.content.split('\n'), l => green(`+${l}`))
  }
  else {
    const diffLines = computeUnifiedDiff(
      file.existingContent!,
      file.content,
      file.path,
    )
    pushContentBox(lines, diffLines)
  }

  lines.push(dim('│'))
}

function formatViewOutput(
  result: DryRunResult,
  componentNames: string[],
  filterPath: string,
) {
  const lines: string[] = []

  lines.push(formatHeader(componentNames))
  lines.push(dim('│'))

  const filesToView = resolveFilterPath(result.files, filterPath)
  const cssMatch = result.css && matchesCssPath(result.css.path, filterPath)

  if (filesToView.length === 0 && !cssMatch) {
    lines.push(
      `${dim('│')} ${yellow(`No file matching "${filterPath}" found.`)}`,
    )
    lines.push(dim('│'))
  }
  else {
    for (const file of filesToView) {
      const contentLines = file.content.split('\n')
      lines.push(
        `${dim('├')} ${bold(file.path)} ${dim('(')}${colorAction(
          file.action,
        )}${dim(')')} ${dim(`${contentLines.length} lines`)}`,
      )
      pushContentBox(lines, contentLines)
      lines.push(dim('│'))
    }

    if (cssMatch && result.css) {
      const contentLines = result.css.content.split('\n')
      lines.push(
        `${dim('├')} ${bold(result.css.path)} ${dim('(')}${colorAction(
          result.css.action,
        )}${dim(')')} ${dim(`${contentLines.length} lines`)}`,
      )
      pushContentBox(lines, contentLines)
      lines.push(dim('│'))
    }
  }

  lines.push(`${dim('└')} ${dim('Run without --dry-run to apply.')}`)

  return lines.join('\n')
}

function formatFilesSection(result: DryRunResult, lines: string[]) {
  if (result.files.length === 0) {
    return
  }

  const counts = { create: 0, overwrite: 0, skip: 0 }
  for (const f of result.files) {
    counts[f.action]++
  }
  const summaryParts: string[] = []
  if (counts.create > 0) {
    summaryParts.push(green(`+${counts.create} new`))
  }
  if (counts.overwrite > 0) {
    summaryParts.push(yellow(`~${counts.overwrite} overwrite`))
  }
  if (counts.skip > 0) {
    summaryParts.push(dim(`=${counts.skip} skip`))
  }
  const summary
    = summaryParts.length > 0 ? ` ${summaryParts.join(dim(', '))}` : ''

  lines.push(
    `${dim('├')} ${bold('Files')} ${dim(`(${result.files.length})`)}${summary}`,
  )

  const maxPathLen = Math.max(...result.files.map(f => f.path.length))

  for (const file of result.files) {
    const glyph = ACTION_GLYPHS[file.action]
    const label = ACTION_LABELS[file.action]
    const padding = ' '.repeat(Math.max(1, maxPathLen - file.path.length + 2))

    const colorFn
      = file.action === 'create'
        ? green
        : file.action === 'overwrite'
          ? yellow
          : dim

    const pathStr = file.action === 'skip' ? dim(file.path) : file.path

    lines.push(
      `${dim('│')} ${colorFn(glyph)} ${pathStr}${padding}${colorFn(label)}`,
    )
  }

  lines.push(dim('│'))
}

function formatListSection(title: string, items: string[], lines: string[]) {
  if (!items.length) {
    return
  }

  lines.push(`${dim('├')} ${bold(title)} ${dim(`(${items.length})`)}`)
  for (const item of items) {
    lines.push(`${dim('│')} ${green('+')} ${item}`)
  }
  lines.push(dim('│'))
}

function formatCssSection(result: DryRunResult, lines: string[]) {
  if (!result.css) {
    return
  }

  lines.push(`${dim('├')} ${bold('CSS')}`)

  if (result.css.cssVarsCount > 0) {
    lines.push(
      `${dim('│')} ${green('+')} ${
        result.css.cssVarsCount
      } CSS variables added to ${cyan(result.css.path)}`,
    )
  }
  else {
    lines.push(`${dim('│')} ${green('+')} Updated ${cyan(result.css.path)}`)
  }

  lines.push(dim('│'))
}

function formatEnvVarsSection(result: DryRunResult, lines: string[]) {
  if (!result.envVars) {
    return
  }

  const vars = Object.keys(result.envVars.variables)
  lines.push(`${dim('├')} ${bold('Environment Variables')}`)
  for (const key of vars) {
    lines.push(`${dim('│')} ${green('+')} ${key}`)
  }
  lines.push(dim('│'))
}

export function resolveFilterPath(files: DryRunFile[], filterPath: string) {
  const exact = files.filter(f => f.path === filterPath)
  if (exact.length > 0) {
    return exact
  }

  return files.filter(
    f =>
      f.path.includes(filterPath)
      || f.path.replace(/\\/g, '/').includes(filterPath),
  )
}

interface HunkEntry {
  kind: 'context' | 'removed' | 'added'
  formatted: string
}

function computeUnifiedDiff(
  oldStr: string,
  newStr: string,
  filePath: string,
  options: { fullContext?: boolean } = {},
) {
  if (isFormattingOnly(oldStr, newStr)) {
    return [dim('  Formatting-only changes (spacing, quotes, semicolons).')]
  }

  const normalizedOld = normalizeFileForDiff(oldStr)
  const normalizedNew = normalizeFileForDiff(newStr)

  const contextLines = options.fullContext
    ? Math.max(
        normalizedOld.split('\n').length,
        normalizedNew.split('\n').length,
      )
    : 3

  const patch = structuredPatch(
    `a/${filePath}`,
    `b/${filePath}`,
    normalizedOld,
    normalizedNew,
    '',
    '',
    { context: contextLines },
  )

  if (!patch.hunks.length) {
    return [dim('  No changes.')]
  }

  const output: string[] = [dim(`--- a/${filePath}`), dim(`+++ b/${filePath}`)]

  const newLines = newStr.split('\n')

  for (const hunk of patch.hunks) {
    const { entries } = processHunk(hunk, newLines)

    if (!entries.some(e => e.kind !== 'context')) {
      continue
    }

    const contextCount = entries.filter(e => e.kind === 'context').length
    const removedCount = entries.filter(e => e.kind === 'removed').length
    const addedCount = entries.filter(e => e.kind === 'added').length

    output.push(
      cyan(
        `@@ -${hunk.oldStart},${contextCount + removedCount} +${
          hunk.newStart
        },${contextCount + addedCount} @@`,
      ),
    )

    for (const entry of entries) {
      output.push(entry.formatted)
    }
  }

  return output
}

function processHunk(
  hunk: { oldStart: number, newStart: number, lines: string[] },
  newLines: string[],
) {
  const entries: HunkEntry[] = []
  let newLineIndex = hunk.newStart - 1
  let i = 0

  while (i < hunk.lines.length) {
    const line = hunk.lines[i]

    if (line.startsWith('-')) {
      const removed: string[] = []
      while (i < hunk.lines.length && hunk.lines[i].startsWith('-')) {
        removed.push(hunk.lines[i].slice(1))
        i++
      }
      while (i < hunk.lines.length && hunk.lines[i].startsWith('\\')) {
        i++
      }
      const added: string[] = []
      while (i < hunk.lines.length && hunk.lines[i].startsWith('+')) {
        added.push(hunk.lines[i].slice(1))
        i++
      }
      while (i < hunk.lines.length && hunk.lines[i].startsWith('\\')) {
        i++
      }

      newLineIndex = processChangeGroup(
        removed,
        added,
        newLines,
        newLineIndex,
        entries,
      )
    }
    else if (line.startsWith('+')) {
      const actual = newLines[newLineIndex] ?? line.slice(1)
      entries.push({ kind: 'added', formatted: green(`+${actual}`) })
      newLineIndex++
      i++
    }
    else if (line.startsWith('\\')) {
      i++
    }
    else {
      const actual = newLines[newLineIndex] ?? line.slice(1)
      entries.push({ kind: 'context', formatted: dim(` ${actual}`) })
      newLineIndex++
      i++
    }
  }

  return { entries, newLineIndex }
}

function processChangeGroup(
  removed: string[],
  added: string[],
  newLines: string[],
  newLineIndex: number,
  entries: HunkEntry[],
) {
  if (isGroupFormattingOnly(removed, added)) {
    for (let j = 0; j < added.length; j++) {
      const actual = newLines[newLineIndex] ?? added[j]
      entries.push({ kind: 'context', formatted: dim(` ${actual}`) })
      newLineIndex++
    }
    return newLineIndex
  }

  const collapsedRemoved = collapseContLines(removed)
  const normalizedCollapsed = collapsedRemoved.map(normalizeLine)
  const usedCollapsed = new Set<number>()

  for (let j = 0; j < added.length; j++) {
    const actualNewLine = newLines[newLineIndex] ?? added[j]
    const normalizedAdded = normalizeLine(added[j])

    const matchIdx = normalizedCollapsed.findIndex(
      (nr, idx) => !usedCollapsed.has(idx) && nr === normalizedAdded,
    )

    if (matchIdx !== -1) {
      usedCollapsed.add(matchIdx)
      entries.push({ kind: 'context', formatted: dim(` ${actualNewLine}`) })
    }
    else {
      const unmatchedIdx = normalizedCollapsed.findIndex(
        (_, idx) => !usedCollapsed.has(idx),
      )
      if (unmatchedIdx !== -1) {
        usedCollapsed.add(unmatchedIdx)
        const { oldHighlighted, newHighlighted } = highlightInlineChanges(
          collapsedRemoved[unmatchedIdx],
          actualNewLine,
        )
        entries.push({ kind: 'removed', formatted: oldHighlighted })
        entries.push({ kind: 'added', formatted: newHighlighted })
      }
      else {
        entries.push({
          kind: 'added',
          formatted: green(`+${actualNewLine}`),
        })
      }
    }
    newLineIndex++
  }

  for (let j = 0; j < collapsedRemoved.length; j++) {
    if (!usedCollapsed.has(j)) {
      entries.push({
        kind: 'removed',
        formatted: red(`-${collapsedRemoved[j]}`),
      })
    }
  }

  return newLineIndex
}

function normalizeFileForDiff(str: string) {
  return str
    .split('\n')
    .map((line) => {
      const indent = line.match(/^(\s*)/)?.[1] ?? ''
      const content = line.slice(indent.length)
      return (
        indent
        + content
          .replace(/['"]/g, '"')
          .replace(/;$/g, '')
      )
    })
    .join('\n')
}

function collapseContLines(lines: string[]) {
  const result: string[] = []

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    while (i + 1 < lines.length && line.trimEnd().endsWith(':')) {
      i++
      line = `${line.trimEnd()} ${lines[i].trim()}`
    }

    result.push(line)
  }

  return result
}

function highlightInlineChanges(oldLine: string, newLine: string) {
  const changes = diffWords(oldLine, newLine)

  let oldHighlighted = '-'
  let newHighlighted = '+'

  for (const change of changes) {
    if (change.added) {
      newHighlighted += bold(green(change.value))
    }
    else if (change.removed) {
      oldHighlighted += bold(red(change.value))
    }
    else {
      oldHighlighted += red(change.value)
      newHighlighted += green(change.value)
    }
  }

  return { oldHighlighted, newHighlighted }
}

function normalizeLine(line: string) {
  return line
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/['"]/g, '\'')
    .replace(/;/g, '')
    .replace(/,$/, '')
}

function isFormattingOnly(oldStr: string, newStr: string) {
  const normalize = (str: string) =>
    str
      .split('\n')
      .map(normalizeLine)
      .filter(line => line.length > 0)
      .join(' ')

  return normalize(oldStr) === normalize(newStr)
}

function isGroupFormattingOnly(removed: string[], added: string[]) {
  const normalizeGroup = (lines: string[]) =>
    lines
      .map(normalizeLine)
      .filter(line => line.length > 0)
      .join(' ')

  return normalizeGroup(removed) === normalizeGroup(added)
}
