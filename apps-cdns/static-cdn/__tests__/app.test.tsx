import { RouterProvider, createMemoryHistory } from '@tanstack/react-router'
import { render, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

import { createRouter } from '@vx/start/router/tanstack'
import { Provider } from '@vx/start/vite'

import { vxI18n } from '../src/generated/vx'
import { routeTree } from '../src/routeTree.gen'

const { defineConfig } = vi.hoisted(() => ({ defineConfig: vi.fn() }))

vi.mock('@vx/start/vite', async importOriginal => ({
  ...(await importOriginal<typeof import('@vx/start/vite')>()),
  defineConfig
}))

const renderApp = async (path = '/') => {
  const router = createRouter({
    history: createMemoryHistory({
      initialEntries: [path]
    }),
    routeTree
  })

  await router.load()

  return render(
    <Provider strict={false}>
      <RouterProvider router={router} />
    </Provider>
  )
}

describe('App', () => {
  it('uses the configured default language for the document', async () => {
    await import('../src/app/main')

    expect(defineConfig).toHaveBeenCalledWith(
      expect.objectContaining({ lang: vxI18n.defaultLanguage })
    )
  })

  it('should render successfully', async () => {
    const { baseElement } = await renderApp()

    await waitFor(() => expect(baseElement).toBeTruthy())
  })

  it('should mount app shell container', async () => {
    const { baseElement } = await renderApp()

    await waitFor(() =>
      expect(baseElement.querySelector('.vx-app')).toBeTruthy()
    )
  })
})
