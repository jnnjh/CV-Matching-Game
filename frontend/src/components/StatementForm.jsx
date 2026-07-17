import { useState } from 'react';
import { submitStatement } from '../api/statements';
import styles from './StatementForm.module.css';

export default function StatementForm({ gameCode, playerName, onSuccess }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('✏️ Please write your CV statement first!');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await submitStatement(gameCode, playerName, content.trim());
      setSuccess(true);
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Determine if the button should be disabled
  const isDisabled = loading || success || !content.trim();

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>✍️ Submit Your CV Statement</h2>
      
      <p className={styles.instructions}>
        Write a short statement about yourself. Be personal! Others will try to guess who wrote it!
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="statement" className={styles.label}>
            Your CV Statement <span className={styles.required}>*</span>
          </label>
          <textarea
            id="statement"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="I always code with a cat on my lap, and my guilty pleasure is debugging at 2am."
            className={styles.textarea}
            rows={5}
            required
          />
          <p className={styles.charCount}>{content.length} characters</p>
        </div>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {success && (
          <div className={styles.success}>
            ✅ Statement submitted successfully!
          </div>
        )}

        <button 
          type="submit" 
          className={styles.button}
          disabled={isDisabled}
          title={!content.trim() ? 'Please write your CV statement first' : ''}
        >
          {loading ? 'Submitting...' : success ? 'Submitted ✅' : '🚀 Submit Statement'}
        </button>
      </form>
    </div>
  );
}