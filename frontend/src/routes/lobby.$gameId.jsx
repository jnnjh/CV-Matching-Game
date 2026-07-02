import { useState, useEffect } from 'react';
import { createFileRoute, useParams, useSearch } from '@tanstack/react-router';
import { getLobbyPlayers } from '../api/lobby';
import StatementForm from '../components/StatementForm';
import styles from './lobby.module.css';

export const Route = createFileRoute('/lobby/$gameId')({
  component: LobbyPage,
});

function LobbyPage() {
  const { gameId } = useParams({ from: '/lobby/$gameId' });
  const search = useSearch({ from: '/lobby/$gameId' });
  
  const gameCode = search?.gameCode || '';
  const playerName = search?.playerName || '';
  
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [submissionStatusMap, setSubmissionStatusMap] = useState({});

  // Check if current player has submitted
  const checkSubmissionStatus = async () => {
    if (!gameCode || !playerName) return;
    
    try {
      const response = await fetch(
        `http://localhost:3000/api/statements/status?gameCode=${gameCode}&playerName=${playerName}`
      );
      const data = await response.json();
      setHasSubmitted(data.submitted || false);
    } catch (err) {
      console.error('Failed to check submission status:', err);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Check submission status for all players in the lobby
  const checkAllPlayersStatus = async (playerList) => {
    const statusMap = {};
    
    for (const player of playerList) {
      try {
        const response = await fetch(
          `http://localhost:3000/api/statements/status?gameCode=${gameCode}&playerName=${player.name}`
        );
        const data = await response.json();
        statusMap[player.id] = data.submitted || false;
      } catch (err) {
        console.error(`Failed to check status for ${player.name}:`, err);
        statusMap[player.id] = false;
      }
    }
    
    setSubmissionStatusMap(statusMap);
  };

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const data = await getLobbyPlayers(gameId);
      setPlayers(data.players);
      
      // Check status for all players
      await checkAllPlayersStatus(data.players);
      
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
    checkSubmissionStatus();
    const interval = setInterval(fetchPlayers, 5000);
    return () => clearInterval(interval);
  }, [gameId]);

  const handleStatementSuccess = () => {
    setHasSubmitted(true);
    
    // Optimistically update the status map for the current player
    setSubmissionStatusMap(prev => {
      const currentPlayer = players.find(p => p.name === playerName);
      if (currentPlayer) {
        return { ...prev, [currentPlayer.id]: true };
      }
      return prev;
    });
    
    // The 5-second interval will eventually sync with the server
    // No need to fetch immediately
  };

  if (loading && players.length === 0) {
    return (
      <div className={styles.container}>
        <p>Loading lobby...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>❌ {error}</div>
        <button onClick={fetchPlayers}>Try Again</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🎮 Waiting Room</h1>
      
      <div className={styles.gameInfo}>
        <p>Game Code: <strong>{gameCode || gameId}</strong></p>
        <p className={styles.playerCount}>
          👥 {players.length} player{players.length !== 1 ? 's' : ''} in lobby
        </p>
      </div>

      <div className={styles.playerList}>
        {players.map((player) => {
          const hasPlayerSubmitted = submissionStatusMap[player.id] || false;
          const isCurrentPlayer = player.name === playerName;
          
          return (
            <div key={player.id} className={styles.playerCard}>
              <div className={styles.playerAvatar}>
                {player.photo_url ? (
                  <img 
                    src={player.photo_url} 
                    alt={player.name}
                    className={styles.avatarImage}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className={styles.playerInfo}>
                <p className={styles.playerName}>
                  {player.name}
                  {player.is_host && <span className={styles.hostBadge}>👑 Host</span>}
                  {isCurrentPlayer && <span className={styles.youBadge}> (you)</span>}
                </p>
                <p className={styles.playerStatus}>
                  {hasPlayerSubmitted ? (
                    <span className={styles.statusReady}>✅ Ready to play</span>
                  ) : (
                    <span className={styles.statusWaiting}>⏳ Waiting for statement...</span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {players.length === 0 && (
        <div className={styles.empty}>
          <p>No players have joined yet.</p>
          <p>Share the game code to invite others!</p>
        </div>
      )}

      {/* Statement Form - only for current player who hasn't submitted */}
      {gameCode && playerName && !hasSubmitted && (
        <StatementForm 
          gameCode={gameCode}
          playerName={playerName}
          onSuccess={handleStatementSuccess}
        />
      )}

      {gameCode && playerName && hasSubmitted && (
        <div className={styles.submittedMessage}>
          ✅ You've submitted your statement! Waiting for others...
        </div>
      )}

      <div className={styles.waitingMessage}>
        <p>⏳ Waiting for host to start the game...</p>
      </div>
    </div>
  );
}