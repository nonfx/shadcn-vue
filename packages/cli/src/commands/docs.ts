import { Command } from 'commander'
import path from 'pathe'
import { getShadcnRegistryIndex } from '@/src/registry/api'
import { handleError } from '@/src/utils/handle-error'
import { highlighter } from '@/src/utils/highlighter'
import { logger } from '@/src/utils/logger'

export const docs = new Command()
  .name('docs')
  .description('get docs and usage examples for components')
  .argument('<components...>', 'component names')
  .option(
    '-c, --cwd <cwd>',
    'the working directory. defaults to the current directory.',
    process.cwd(),
  )
  .option('--json', 'output as JSON.', false)
  .action(async (components, opts) => {
    try {
      const cwd = path.resolve(opts.cwd)

      const index = await getShadcnRegistryIndex()

      if (!index) {
        logger.error('Failed to fetch the registry index.')
        process.exit(1)
      }

      const results: {
        component: string
        links: Record<string, string>
      }[] = []

      for (const component of components) {
        const item = index.find(entry => entry.name === component)

        if (!item) {
          logger.error(
            `Component ${highlighter.info(
              component,
            )} not found in the shadcn-vue registry.`,
          )
          process.exit(1)
        }

        const links: Record<string, string> = {
          docs: `https://www.shadcn-vue.com/docs/components/${component}`,
        }

        results.push({ component, links })
      }

      if (opts.json) {
        console.log(JSON.stringify({ results }, null, 2))
        return
      }

      for (const { component, links } of results) {
        logger.log(highlighter.info(component))
        for (const [key, value] of Object.entries(links)) {
          logger.log(`  - ${key.padEnd(10)}${value}`)
        }
        logger.break()
      }
    }
    catch (error) {
      handleError(error)
    }
  })
