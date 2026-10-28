import * as styles from './Badge.scss' with { type: 'pre.style' };

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'accent';
  children: React.ReactNode;
}) {
  return (
    <span className={tone === 'accent' ? styles.accent : styles.badge}>
      <span className={styles.dot} />
      {children}
    </span>
  );
}
