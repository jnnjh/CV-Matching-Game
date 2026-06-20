import { createFileRoute } from '@tanstack/react-router'

// File name determines the URL path:  index.tsx → "/"
export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div>
      <h1>🏠 Home</h1>
      <p>Welcome to your MigraCode fullstack project!</p>
      <p>
        Edit <code>src/routes/index.tsx</code> to change this page.
      </p>
    </div>
  )
}
