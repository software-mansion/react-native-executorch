import styles from './styles.module.css';

export const SlideContent = ({
  slide,
}: {
  slide: {
    id: number;
    title: string;
    link: string;
    imageUrl: string;
  };
}) => {
  return (
    <a href={slide.link}>
      <div className={styles.slideContainer}>
        {slide.imageUrl && (
          <div className={styles.imageContainer}>
            <img
              src={slide.imageUrl}
              alt={slide.title}
              className={styles.image}
            />
          </div>
        )}
        <div className={styles.overlay}>
          <div className={styles.content}>
            <p className={styles.slideTitle}>{slide.title}</p>
          </div>
        </div>
      </div>
    </a>
  );
};
