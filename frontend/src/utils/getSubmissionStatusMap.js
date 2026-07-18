import { getPlayerSubmissionStatus } from '../api/statements'

export async function getSubmissionStatusMap(gameCode, players) {
  const submissions = await Promise.all(
    players.map(async (player) => {
      try {
        const data = await getPlayerSubmissionStatus(gameCode, player.name)

        return [player.id, data.submitted || false]
      } catch {
        return [player.id, false]
      }
    }),
  )

  return Object.fromEntries(submissions)
}