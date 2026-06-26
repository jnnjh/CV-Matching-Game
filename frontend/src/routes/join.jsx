import { useState } from 'react';
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { joinGame } from '../api/players';
import styles from './join.module.css';

function JoinComponent() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/join' });
  const gameCodeFromUrl = search?.code || '';
  
  const [formData, setFormData] = useState({
    gameCode: gameCodeFromUrl,
    name: '',
    photo: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({ ...prev, photo: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await joinGame(formData.gameCode, formData.name);
      setSuccess(true);
      console.log('Joined game:', result);
      
      setTimeout(() => {
        // navigate({ to: `/game/${result.game.id}` });
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Join a Game</h1>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="gameCode" className={styles.label}>
            Game Code <span className={styles.required}>*</span>
          </label>
          <input
            id="gameCode"
            name="gameCode"
            type="text"
            value={formData.gameCode}
            onChange={handleChange}
            placeholder="Enter game code (e.g., ABC123)"
            className={styles.input}
            required
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="name" className={styles.label}>
            Your Name <span className={styles.required}>*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
            className={styles.input}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="photo" className={styles.label}>
            Profile Photo (optional)
          </label>
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={styles.fileInput}
          />
        </div>

        {error && (
          <div className={styles.error}>
            ❌ {error}
          </div>
        )}

        {success && (
          <div className={styles.success}>
            ✅ Successfully joined the game!
          </div>
        )}

        <button 
          type="submit" 
          className={styles.button}
          disabled={loading}
        >
          {loading ? 'Joining...' : 'Join Game'}
        </button>
      </form>

      <p className={styles.footer}>
        Don't have a game? <a href="/create-game" className={styles.link}>Create one</a>
      </p>
    </div>
  );
}

// This is the important part - exporting the Route
export const Route = createFileRoute('/join')({
  component: JoinComponent,
});