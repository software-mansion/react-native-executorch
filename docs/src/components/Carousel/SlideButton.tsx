import styles from './styles.module.css';

export const SlideButton = ({
  forward,
  onClick,
}: {
  forward: boolean;
  onClick: () => void;
}) => {
  const aria = forward ? 'Next slide' : 'Previous slide';

  return (
    <div style={{ display: 'flex' }}>
      <button
        onClick={onClick}
        className={forward ? styles.nextButton : styles.prevButton}
        aria-label={aria}
      >
        {forward ? (
          <svg
            className={styles.icon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        ) : (
          <svg
            className={styles.icon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        )}
      </button>
    </div>
  );
};
