import { getPlayerSubmissionStatus } from '../api/statements'

export async function getSubmissionStatusMap(gameCode, players) {
  const statusMap = {}

  for (const player of players) {
    try {
      const data = await getPlayerSubmissionStatus(gameCode, player.name)
      statusMap[player.id] = data.submitted || false
    } catch {
      statusMap[player.id] = false
    }
  }

  return statusMap
}