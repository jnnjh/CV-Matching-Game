import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import styles from './__root.module.css'

// __root.tsx is the layout that wraps ALL pages.
// Add your nav, header, footer here.
export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <nav className={styles.nav}>
        <Link to="/" activeProps={{ className: styles.navLinkActive }} className={styles.navLink}>
          Home
        </Link>
        <Link
          to="/about"
          activeProps={{ className: styles.navLinkActive }}
          className={styles.navLink}
        >
          About
        </Link>
        <Link
          to="/users"
          activeProps={{ className: styles.navLinkActive }}
          className={styles.navLink}
        >
          Users
        </Link>
      </nav>

      {/* Outlet renders the matched child route */}
      <main className={styles.main}>
        <Outlet />
      </main>

      {/* Remove TanStackRouterDevtools in production */}
      <TanStackRouterDevtools />
    </>
  )
}
