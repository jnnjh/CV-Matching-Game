import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/join-game')({
  beforeLoad: ({ search }) => {
    const code = search?.code || ''
    
    // Redirect to join page with the code
    throw redirect({
      to: '/join',
      search: { code },
    })
  },
})