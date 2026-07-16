import { Link } from '@tanstack/react-router'
import styles from './Brand.module.css'

export default function Brand({ size = 'small' }) {
  const iconSize = size === 'large' ? 80 : 48
  const fontSize = size === 'large' ? '4rem' : '2.5rem'
  const gap = size === 'large' ? '1rem' : '0.75rem'

  return (
    <Link to="/" className={styles.brandLink}>
      <div className={styles.brand} style={{ gap }}>
        <img 
          src="/icon.png" 
          alt="CVVHO" 
          className={styles.brandIcon}
          style={{ width: iconSize, height: iconSize }}
        />
        <h1 className={styles.brandName} style={{ fontSize }}>
          C<span className={styles.vvOverlap}>VV</span>HO
        </h1>
      </div>
    </Link>
  )
}