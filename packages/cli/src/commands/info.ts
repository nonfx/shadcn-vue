import { Command } from 'commander'
import consola from 'consola'
import path from 'pathe'
import { getConfig } from '@/src/utils/get-config'
import { getProjectInfo } from '@/src/utils/get-project-info'
import { handleError } from '@/src/utils/handle-error'
import { logger } from '@/src/utils/logger'

export const info = new Command()
  .name('info')
  .description('get information about your project')
  .option(
    '-c, --cwd <cwd>',
    'the working directory. defaults to the current directory.',
    process.cwd(),
  )
  .option('--json', 'output as JSON.', false)
  .action(async (opts) => {
    try {
      const cwd = path.resolve(opts.cwd)
      const projectInfo = await getProjectInfo(cwd)
      const config = await getConfig(cwd)

      if (opts.json) {
        console.log(JSON.stringify({
          projectInfo,
          config: config
            ? {
                style: config.style,
                typescript: config.typescript,
                tailwind: config.tailwind,
                aliases: config.aliases,
                resolvedPaths: config.resolvedPaths,
                registries: config.registries,
              }
            : null,
        }, null, 2))
        return
      }

      logger.info('> project info')
      consola.log(projectInfo)
      logger.break()
      logger.info('> components.json')
      consola.log(config)
    }
    catch (error) {
      handleError(error)
    }
  })
