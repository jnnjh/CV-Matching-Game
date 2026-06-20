import { createFileRoute } from '@tanstack/react-router'

// about.tsx → "/about"
export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return (
    <div>
      <h1>ℹ️ About</h1>
      <p>
        This project was scaffolded with <strong>create-migracode-app</strong>.
      </p>
    </div>
  )
}
