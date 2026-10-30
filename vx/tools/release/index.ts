import { createProjectGraphAsync } from '@nx/devkit'
import { appendFileSync } from 'node:fs'
import { ReleaseClient, releaseChangelog, releaseVersion } from 'nx/release'
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import { generateReleaseMetadata } from './generate-metadata'
import { runRelease } from './run-release'

const NS = '[vezham] TOOLS/release'

const main = async () => {
  const options = await yargs(hideBin(process.argv))
    .version(false)
    .strict()
    .option('version', {
      alias: 'v',
      description:
        'Explicit version or increment; empty uses conventional commits',
      type: 'string',
      default: ''
    })
    .option('dryRun', {
      alias: 'd',
      description: 'Preview release operations without writing or publishing',
      type: 'boolean',
      default: false
    })
    .option('verbose', {
      description: 'Enable verbose logging',
      type: 'boolean',
      default: false
    })
    .option('firstRelease', {
      alias: 'fr',
      description:
        'Bootstrap a release without previous tags; requires a version',
      type: 'boolean',
      default: false
    })
    .parseAsync()
  console.log(NS, '[data] options: ', JSON.stringify(options))

  process.exitCode = await runRelease(options, {
    version: releaseVersion,
    reportVersion: version => {
      if (process.env.GITHUB_OUTPUT)
        appendFileSync(
          process.env.GITHUB_OUTPUT,
          `release_version=${version}\n`
        )
    },
    reportPublish: ({ published, total }) => {
      if (process.env.GITHUB_OUTPUT)
        appendFileSync(
          process.env.GITHUB_OUTPUT,
          `release_published_count=${published ?? ''}\nrelease_publishable_count=${total}\n`
        )
    },
    generateMetadata: generateReleaseMetadata,
    changelog: releaseChangelog,
    publish: async options => {
      // vx-bot/NOTE: Publish from a separate group so fixed workspace versioning can include private projects.
      const client = new ReleaseClient({ projects: options.projects }, true)
      return client.releasePublish(options)
    },
    getPublishProjects: async () => {
      const graph = await createProjectGraphAsync()
      return Object.keys(graph.nodes).filter(
        name => graph.nodes[name]?.data.targets?.['nx-release-publish']
      )
    }
  })
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
