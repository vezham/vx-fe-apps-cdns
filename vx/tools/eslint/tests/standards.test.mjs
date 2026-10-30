import nx from '@nx/eslint-plugin'
import { ESLint } from 'eslint'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

import accessibilityLabels from '../accessibility-labels.mjs'
import button from '../button-on-press.mjs'
import comments from '../comment-style.mjs'
import dot from '../dot-notation.mjs'
import named from '../named-exports.mjs'
import props from '../props-name.mjs'
import barrel from '../wildcard-barrel.mjs'

const parser = nx.configs['flat/typescript'].find(
  c => c.languageOptions?.parser
).languageOptions.parser
const cases = [
  [
    accessibilityLabels,
    "import { Button } from '@vezham/react-v3'; const X = () => <Button isIconOnly />;",
    1
  ],
  [
    accessibilityLabels,
    'import { Button } from \'@vezham/react-v3\'; const X = () => <Button isIconOnly aria-label="Close" />;',
    0
  ],
  [
    accessibilityLabels,
    "import { Table } from '@vezham/react-v3'; const X = () => <Table.Content />;",
    1
  ],
  [
    accessibilityLabels,
    'import { Table } from \'@vezham/react-v3\'; const X = () => <Table.Content aria-labelledby="orders-heading" />;',
    0
  ],
  [
    accessibilityLabels,
    "import * as UI from '@vezham/react-v3'; const X = () => <UI.Button isIconOnly />;",
    1
  ],
  [
    accessibilityLabels,
    "import * as UI from '@vezham/react-v3'; const X = () => <UI.Table.Content />;",
    1
  ],
  [
    accessibilityLabels,
    "import { Button } from '@vezham/react-v3'; const X = () => <Button isIconOnly={false} />;",
    0
  ],
  [
    accessibilityLabels,
    'const Button = () => null; const X = () => <Button isIconOnly />;',
    0
  ],
  [dot, "import { CardHeader as Heading } from '@vezham/react-v3';", 1],
  [dot, "import { SwitchThumb } from '@vezham/react-v3/switch';", 1],
  [dot, "import { ContextMenuPopover } from '@vezham/react-pro-v3';", 1],
  [
    dot,
    "import { Button, Card } from '@vezham/react-v3'; const X = () => <Card.Header><Button /></Card.Header>;",
    0
  ],
  [dot, "import { CardHeader } from './custom';", 0],
  [dot, "import type { CardHeaderProps } from '@vezham/react-v3';", 0],
  [dot, "import { type CardHeaderProps } from '@vezham/react-v3';", 0],
  [
    dot,
    "import * as UI from '@vezham/react-v3'; const X = () => <UI.CardHeader />;",
    1
  ],
  [
    dot,
    "import * as UI from '@vezham/react-v3'; const X = () => <UI.Card.Header />;",
    0
  ],
  [
    dot,
    "import * as UI from '@vezham/react-v3'; const X = (UI: any) => <UI.CardHeader />;",
    0
  ],
  [
    dot,
    "import * as UI from '@vezham/react-v3'; const Header = UI['CardHeader'];",
    1
  ],
  [dot, "export { CardHeader as Header } from '@vezham/react-v3';", 1],
  [dot, "export type { CardHeaderProps } from '@vezham/react-v3';", 0],
  [
    button,
    "import {Button as B} from '@vezham/react-v3/button'; const X = () => <B onClick={run}/>;",
    1
  ],
  [
    button,
    "import {Button} from '@vezham/react-v3/button'; const X = () => <Button onPress={run}/>;",
    0
  ],
  [
    props,
    "import type { Props } from './types'; interface CreateProviderProps { env: boolean }",
    0
  ],
  [
    props,
    "import type { Props } from './types'; type DocsConfigProps = Props & { docs: boolean }",
    0
  ],
  [
    props,
    "import { BaseProps as Props } from './types'; type DocsConfigProps = Props & { docs: boolean }",
    0
  ],
  [
    props,
    "import type Props from './types'; interface CreateProviderProps { env: boolean }",
    0
  ],
  [
    props,
    "import type { Props as BaseProps } from './types'; type PageProps = BaseProps & { docs: boolean }",
    1
  ],
  [
    props,
    'interface Props { env: boolean }; export type { Props }',
    0,
    { allowExportedProps: true }
  ],
  [
    props,
    'export type Props = { env: boolean }',
    0,
    { allowExportedProps: true }
  ],
  [
    props,
    'type Props = {}; export type { Props as Data }',
    1,
    { allowExportedProps: true }
  ],
  [props, 'type Props = {}; export type { Props, Props as PageProps }', 1],
  [props, 'type Props = {}; export type { Props as Data }', 1],
  [
    button,
    "import {Button} from '@vezham/react-v3'; const X = () => <Button onClick={run}/>;",
    1
  ],
  [
    button,
    "import {Button as B} from '@vezham/react-v3'; const X = () => <B onClick={run}/>;",
    1
  ],
  [
    button,
    "import {Button} from '@vezham/react-v3'; const X = (Button: any) => <Button onClick={run}/>;",
    0
  ],
  [
    button,
    "import {Button} from 'other'; const X = () => <Button onClick={run}/>;",
    0
  ],
  [button, 'const X = () => <button onClick={run}/>;', 0],
  [
    comments,
    '// vx-bot/NOTE: Keep hydration consistent.\n// until ready.\nconst x = 1',
    0
  ],
  [
    comments,
    "// vx-bot/NOTE: Retain the branch suffix for a future canary flow.\n// let version = ''\n// if (branch !== 'main') version = branch",
    0
  ],
  [comments, '// wjdlz/NOTE(vx): Keep compatibility.\nconst x = 1', 0],
  [comments, '// plain comment\nconst x = 1', 1],
  [comments, '// codex/NOTE: Keep compatibility.\nconst x = 1', 1],
  [comments, '// vx-bot/NOTE: \nconst x = 1', 1],
  [comments, '// prettier-ignore\nconst x = 1', 0],
  [comments, '/** Public API documentation. */\nconst x = 1', 0],
  [
    comments,
    '// vx-bot/NOTE: First comment.\nconst x = 1\n// unstructured new comment',
    1
  ],
  [named, 'export default () => null', 1],
  [named, 'const A = 1; export { A as default }', 1],
  [named, 'export const A = 1', 0],
  [barrel, "export { A } from './a'; export { B } from './b'", 2],
  [barrel, "export * from './a'", 0],
  [barrel, "export { default as A } from './a'", 0],
  [barrel, "export { A as B } from './a'", 0],
  [barrel, "export const x = 1; export { A } from './a'", 0],
  [barrel, "export { A } from '@vezham/hooks'", 0],
  [barrel, "export type { A } from 'other-package'", 0],
  [barrel, "export { A } from '@vezham/hooks'; export { B } from './b'", 1],
  [
    props,
    'type PageProps = { value: string }; export const Page = (p: PageProps) => null',
    1
  ],
  [
    props,
    'type Props = { value: string }; export const Page = (p: Props) => null',
    0
  ],
  [props, 'export type Props = { value: string }', 1],
  [props, 'export interface Props { value: string }', 1],
  [props, 'export type PageProps = { value: string }', 0],
  [
    props,
    'type Props = { value: string }; export type { Props as PageProps }',
    0
  ],
  [props, 'type PageProps = {}; type ButtonProps = {}', 0],
  [props, 'type Props = {}; export type { Props }', 1]
]
for (const [rule, code, errors, options = {}] of cases) {
  test(`${Object.keys(rule.meta.messages)[0]}: ${code}`, async () => {
    const lint = new ESLint({
      overrideConfigFile: true,
      fix: true,
      overrideConfig: [
        {
          files: ['**/*.tsx'],
          languageOptions: { parser },
          plugins: { vx: { rules: { check: rule } } },
          rules: {
            'vx/check': rule === props ? ['error', options] : 'error'
          }
        }
      ]
    })
    const [result] = await lint.lintText(code, { filePath: 'fixture.tsx' })
    assert.equal(result.errorCount, errors, JSON.stringify(result.messages))
    assert.equal(result.output, undefined, 'Rules must not make unsafe edits')
  })
}

const createWorkspace = async t => {
  const root = await mkdtemp(path.join(tmpdir(), 'vx-eslint-fixture-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const configUrl = new URL('../../../../eslint.config.mjs', import.meta.url)
    .href
  // vx-bot/NOTE: Rebase the real config onto an isolated workspace without sample apps.
  await writeFile(
    path.join(root, 'eslint.config.mjs'),
    `
import config from ${JSON.stringify(configUrl)}
export default config.map(entry => entry.basePath ? { ...entry, basePath: ${JSON.stringify(root)} } : entry)
`
  )
  for (const project of [
    'apps/example',
    'apps-internal/example',
    'packages/example'
  ]) {
    const directory = path.join(root, project)
    await mkdir(directory, { recursive: true })
    await writeFile(
      path.join(directory, 'eslint.config.mjs'),
      "export { default } from '../../eslint.config.mjs'\n"
    )
  }
  return root
}

test('wildcard rule recognizes exact, conditional, and wildcard package entries from any cwd', async t => {
  const root = await createWorkspace(t)
  const project = path.join(root, 'packages/example')
  await writeFile(
    path.join(project, 'package.json'),
    JSON.stringify({
      exports: {
        './public': './src/lib/public/index.ts',
        './conditional': {
          types: './src/lib/conditional/index.ts',
          default: './workspace/conditional.js'
        },
        './features/*': {
          '@vx/fe-kit': './src/lib/features/*/index.ts',
          import: './dist/lib/features/*/index.js'
        },
        './version': './src/lib/version.v1/index.ts',
        './fallback': [null, { types: './src/lib/fallback/index.ts' }]
      }
    })
  )
  for (const cwd of [root, project]) {
    const lint = new ESLint({
      cwd,
      overrideConfigFile: true,
      overrideConfig: [
        {
          files: ['**/*.ts'],
          languageOptions: { parser },
          plugins: { vx: { rules: { barrel } } },
          rules: { 'vx/barrel': 'error' }
        }
      ]
    })
    for (const [file, expected] of [
      ['public/index.ts', 0],
      ['conditional/index.ts', 0],
      ['features/one/index.ts', 0],
      ['features/nested/one/index.ts', 0],
      ['version.v1/index.ts', 0],
      ['versionXv1/index.ts', 1],
      ['fallback/index.ts', 0],
      ['internal/index.ts', 1],
      ['public/internal/index.ts', 1]
    ]) {
      const filePath = path.join(project, 'src/lib', file)
      const [result] = await lint.lintText("export { A } from './a'", {
        filePath
      })
      assert.equal(result.errorCount, expected, `${cwd}: ${file}`)
    }
    const nested = path.join(project, 'src/lib/nested')
    await mkdir(nested, { recursive: true })
    await writeFile(path.join(nested, 'package.json'), '{invalid json')
    const [result] = await lint.lintText("export { A } from './a'", {
      filePath: path.join(nested, 'index.ts')
    })
    assert.equal(
      result.errorCount,
      1,
      'Malformed package metadata must not exempt internal barrels'
    )
  }
})

test('shared configuration scopes framework exceptions and agent exclusion', async t => {
  const root = await createWorkspace(t)
  const lint = new ESLint({ cwd: root })
  const severity = async (path, rule) =>
    (await lint.calculateConfigForFile(path)).rules[`@vx-lint/${rule}`]?.[0] ??
    0
  for (const path of [
    'apps-internal/example/src/pages/home/index.tsx',
    'apps/example/src/vx-pages/pro/index.tsx',
    'apps/example/src/pages/home/index.tsx'
  ]) {
    assert.equal(await severity(path, 'named-exports'), 0)
    assert.equal(await severity(path, 'button-on-press'), 2)
  }
  assert.equal(
    await severity('apps/example/src/app/page.tsx', 'named-exports'),
    0
  )
  assert.equal(
    await severity(
      'packages/example/src/lib/pages/home/index.tsx',
      'named-exports'
    ),
    2
  )
  assert.equal(
    await severity('.agents/skills/example/script.mjs', 'comment-style'),
    0
  )
  assert.equal(
    await severity(
      'packages/example/src/lib/store/index.ts',
      'wildcard-barrel'
    ),
    2
  )
  assert.equal(
    await severity('packages/example/src/index.ts', 'wildcard-barrel'),
    0
  )
})

test('shared comment rule checks YAML comments and permits continuations', async t => {
  const root = await createWorkspace(t)
  const lint = new ESLint({ cwd: root })
  const [result] = await lint.lintText(
    '# vx-bot/TODO: Update the package name\n# when the fork is published.\n\n# Unstructured note\npackages: []\n',
    { filePath: 'pnpm-workspace.yaml' }
  )
  assert.deepEqual(
    result.messages
      .filter(message => message.ruleId === '@vx-lint/comment-style')
      .map(message => message.line),
    [4]
  )
})

test('folder-local props exception stays scoped to internal types modules', async t => {
  const root = await createWorkspace(t)
  const lint = new ESLint({ cwd: root })
  for (const [filePath, expected] of [
    ['packages/example/src/lib/types.ts', 0],
    ['packages/example/src/lib/index.tsx', 1],
    ['packages/example/src/index.ts', 1]
  ]) {
    const results = await lint.lintText(
      'interface Props { env: boolean }; export type { Props }',
      { filePath }
    )
    assert.equal(
      results[0].messages.filter(m => m.ruleId === '@vx-lint/props-name')
        .length,
      expected
    )
  }
})

test('named export exceptions work from Nx project working directories', async t => {
  const root = await createWorkspace(t)
  for (const [project, filePath, expected] of [
    ['apps-internal/example', 'src/pages/home/index.tsx', 0],
    ['apps/example', 'src/vx-pages/home/index.tsx', 0],
    ['packages/example', 'src/lib/pages/home/index.tsx', 1]
  ]) {
    const lint = new ESLint({ cwd: path.join(root, project) })
    const [result] = await lint.lintText('export default () => null', {
      filePath
    })
    assert.equal(
      result.messages.filter(m => m.ruleId === '@vx-lint/named-exports').length,
      expected
    )
  }
})
