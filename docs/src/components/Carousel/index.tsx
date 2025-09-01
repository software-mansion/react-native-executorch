// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import { useState, useEffect, useRef } from 'react';
import styles from './styles.module.css';

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
}

export default function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions()
  );

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
}

export const Carousel = ({ slides = [], ...props }) => {
  const defaultSlides = [
    {
      id: 1,
      title: 'Introducing React Native ExecuTorch',
      link: 'https://blog.swmansion.com/introducing-react-native-executorch-2bdb87592884',
      image:
        'https://miro.medium.com/v2/resize:fit:1400/format:webp/1*tuy5VQscaHXQr2o3Ee4rlA.png',
    },
    {
      id: 2,
      title: 'Bringing Native AI To Your Mobile Apps With ExecuTorch',
      link: 'http://blog.swmansion.com/bringing-native-ai-to-your-mobile-apps-with-executorch-part-ii-android-29431b6b9f7f',
      image:
        'https://miro.medium.com/v2/resize:fit:1400/format:webp/1*7R1KI51nJu0VH6cyzKWl0A.png',
    },
    {
      id: 3,
      title: 'Exporting AI Models On Android With XNNpack And ExecuTorch',
      link: 'https://blog.swmansion.com/exporting-ai-models-on-android-with-xnnpack-and-executorch-3e70cff51c59',
      image:
        'https://miro.medium.com/v2/resize:fit:1400/format:webp/1*X2r5VtXT4N-kPkO3l3bIRg.jpeg',
    },
    {
      id: 4,
      title: 'A Year In Review 2024 At Software Mansion Multimedia AI Teams',
      link: 'https://blog.swmansion.com/a-year-in-review-2024-at-software-mansion-multimedia-ai-teams-cb02881b1cb7',
      image:
        'https://miro.medium.com/v2/resize:fit:1400/format:webp/1*oXfbudWHJZEcyvNY27D6qA.png',
    },
    {
      id: 5,
      title: 'Bringing EasyOCR To React Native ExecuTorch',
      link: 'https://blog.swmansion.com/bringing-easyocr-to-react-native-executorch-2401c09c2d0c',
      image:
        'https://miro.medium.com/v2/resize:fit:1400/format:webp/1*_cemUci-bZ1_DmlK6ovVUw.png',
    },
    {
      id: 6,
      title: 'React Native ExecuTorch Release v0.4.0',
      link: 'https://blog.swmansion.com/react-native-executorch-release-v0-4-0-262d4013ac10',
      image:
        'https://miro.medium.com/v2/resize:fit:1400/format:webp/1*HdXtQG2oXZv3uo5HxCbwlQ.png',
    },
    {
      id: 7,
      title: 'Introducing React Native Rag',
      link: 'https://blog.swmansion.com/introducing-react-native-rag-fbb62efa4991',
      image:
        'https://miro.medium.com/v2/resize:fit:1400/format:webp/1*PpRHgQNZXcTr6_5nmht7tw.png',
    },
    {
      id: 8,
      title:
        'Top-6 Local AI Models For Maximum Privacy And Offline Capabilities',
      link: 'https://blog.swmansion.com/top-6-local-ai-models-for-maximum-privacy-and-offline-capabilities-888160243a94',
      image:
        'https://miro.medium.com/v2/resize:fit:1400/format:webp/1*jWMkuYR6wynFqQ4C_dkBcw.png',
    },
    {
      id: 9,
      title: 'Retrieval Augmented Generation Explained',
      link: 'https://blog.swmansion.com/retrieval-augmented-generation-explained-840cbd744c99',
      image:
        'https://miro.medium.com/v2/resize:fit:1400/format:webp/1*QH0IpDRt38G5wI2wXkc61w.png',
    },
  ];
  const swiperRef = useRef(null);

  const carouselSlides = slides.length > 0 ? slides : defaultSlides;

  return (
    <div>
      <div style={{ paddingBottom: '3rem' }}>
        <h2>Learn more about React Native ExecuTorch</h2>
      </div>

      <div className={styles.container}>
        <div style={{ display: 'flex' }}>
          <button
            onClick={() => swiperRef.current?.swiper?.slidePrev()}
            className={styles.prevButton}
            aria-label="Previous slide"
          >
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
          </button>
        </div>
        <Swiper
          modules={[Pagination, Autoplay]}
          ref={swiperRef}
          spaceBetween={30}
          slidesPerView={1}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          breakpoints={{
            768: { slidesPerView: 2 },
            1280: { slidesPerView: 3 },
          }}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
          }}
          loop={true}
          style={{ height: 'fit-content', width: '100%' }}
          {...props}
        >
          {carouselSlides.map((slide) => (
            <SwiperSlide key={slide.id}>
              <a href={slide.link}>
                <div className={styles.slideContainer}>
                  {slide.image && (
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className={styles.image}
                    />
                  )}
                  <div className={styles.overlay}>
                    <div className={styles.content}>
                      <h3 className={styles.title}>{slide.title}</h3>
                      <p className={styles.description}>{slide.content}</p>
                    </div>
                  </div>
                </div>
              </a>
            </SwiperSlide>
          ))}
        </Swiper>
        <div style={{ display: 'flex' }}>
          <button
            onClick={() => swiperRef.current?.swiper?.slideNext()}
            className={styles.nextButton}
            aria-label="Next slide"
          >
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
          </button>
        </div>
      </div>
    </div>
  );
};
