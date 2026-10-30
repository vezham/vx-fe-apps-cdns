import type {
  releaseChangelog,
  releasePublish,
  releaseVersion
} from 'nx/release'

export type ReleaseOptions = {
  version: string
  dryRun: boolean
  verbose: boolean
  firstRelease: boolean
}

type ReleaseAPI = {
  version: (
    options: Parameters<typeof releaseVersion>[0]
  ) => Promise<
    Pick<
      Awaited<ReturnType<typeof releaseVersion>>,
      'workspaceVersion' | 'projectsVersionData'
    >
  >
  changelog: (
    options: Parameters<typeof releaseChangelog>[0]
  ) => Promise<unknown>
  getPublishProjects: () => Promise<string[]>
  generateMetadata: (names: string[]) => Promise<void>
  reportVersion?: (version: string) => void
  reportPublish?: (counts: {
    published: number | undefined
    total: number
  }) => void
  publish: typeof releasePublish
}

export const runRelease = async (
  options: ReleaseOptions,
  api: ReleaseAPI
): Promise<number> => {
  if (options.firstRelease && !options.version.trim()) {
    throw new Error('First release requires an explicit version, such as 0.0.1')
  }
  const common = {
    dryRun: options.dryRun,
    verbose: options.verbose,
    firstRelease: options.firstRelease
  }
  const publishableProjects = await api.getPublishProjects()
  let published: number | undefined = 0
  try {
    const { workspaceVersion, projectsVersionData } = await api.version({
      ...common,
      specifier: options.version || undefined
    })
    const changedProjects = Object.entries(projectsVersionData)
      .filter(([, project]) => project.newVersion)
      .map(([name]) => name)
    if (changedProjects.length === 0) {
      console.log('[vezham] No version changes; nothing to publish.')
      return 0
    }
    if (workspaceVersion) api.reportVersion?.(workspaceVersion)
    if (!options.dryRun) await api.generateMetadata(changedProjects)
    await api.changelog({
      ...common,
      versionData: projectsVersionData,
      version: workspaceVersion
    })
    const projects = changedProjects.filter(name =>
      publishableProjects.includes(name)
    )
    if (projects.length === 0) {
      console.log(
        '[vezham] No release projects have a publish target; skipping npm publishing.'
      )
      return 0
    }
    published = undefined
    const results = await api.publish({ ...common, projects, access: 'public' })
    published = options.dryRun
      ? 0
      : projects.filter(name => results[name]?.code === 0).length
    return projects.every(name => results[name]?.code === 0) ? 0 : 1
  } finally {
    api.reportPublish?.({ published, total: publishableProjects.length })
  }
}
