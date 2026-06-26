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
    return <div>Loading lobby...</div>;
  }

  if (error) {
    return (
      <div>
        <div>❌ {error}</div>
        <button onClick={fetchPlayers}>Try Again</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>🎮 Waiting Room</h1>
      
      <div>
        <p>Game Code: <strong>{gameId}</strong></p>
        <p>👥 {players.length} player{players.length !== 1 ? 's' : ''} in lobby</p>
      </div>

      <div>
        {players.map((player) => (
          <div key={player.id}>
            <div>
              {player.photo_url ? (
                <img src={player.photo_url} alt={player.name} />
              ) : (
                <div>{player.name.charAt(0).toUpperCase()}</div>
              )}
            </div>
            <div>
              <p>
                {player.name}
                {player.is_host && <span> 👑 Host</span>}
              </p>
            </div>
          </div>
        ))}
      </div>

      {players.length === 0 && (
        <div>
          <p>No players have joined yet.</p>
          <p>Share the game code to invite others!</p>
        </div>
      )}

      <div>
        <p>⏳ Waiting for host to start the game...</p>
      </div>
    </div>
  );
}