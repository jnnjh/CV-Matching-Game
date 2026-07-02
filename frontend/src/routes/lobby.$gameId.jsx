import StatementForm from '../components/StatementForm';
import { useState, useEffect } from 'react';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { getLobbyPlayers } from '../api/lobby';
import styles from './lobby.module.css';

export const Route = createFileRoute('/lobby/$gameId')({
  component: LobbyPage,
});

function LobbyPage() {
  const { gameId } = useParams({ from: '/lobby/$gameId' });
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const data = await getLobbyPlayers(gameId);
      setPlayers(data.players);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 5000);
    return () => clearInterval(interval);
  }, [gameId]);

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
        <p>Game Code: <strong>{gameId}</strong></p>
        <p className={styles.playerCount}>
          👥 {players.length} player{players.length !== 1 ? 's' : ''} in lobby
        </p>
      </div>

      <div className={styles.playerList}>
        {players.map((player) => (
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
              </p>
              <p className={styles.playerStatus}>
                {player.is_host ? 'Waiting to start...' : 'Ready to play!'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {players.length === 0 && (
        <div className={styles.empty}>
          <p>No players have joined yet.</p>
          <p>Share the game code to invite others!</p>
        </div>
      )}

      {/* Statement Form */}
      <StatementForm 
        gameCode={gameId} 
        playerName="Alice" 
        onSuccess={() => console.log('Statement submitted!')}
      />

      <div className={styles.waitingMessage}>
        <p>⏳ Waiting for host to start the game...</p>
      </div>
    </div>
  );
}