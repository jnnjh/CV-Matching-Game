import styles from './UserCard.module.css'
// UserCard is a simple presentational component.
// Put reusable UI pieces like this in src/components/.
export function UserCard({ name, role }) {
  return (
    <div className={styles.card}>
      <strong>{name}</strong>
      {' — '}
      <em>{role}</em>
    </div>
  )
}
