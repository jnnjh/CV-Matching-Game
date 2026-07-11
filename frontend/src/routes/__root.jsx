import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import styles from './__root.module.css'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <main className={styles.main}>
        <Outlet />
      </main>

      <TanStackRouterDevtools />
    </>
  )
}