import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import { useState, useEffect, useRef } from 'react';
import styles from './styles.module.css';
import { SlideButton } from './SlideButton';
import { SlideContent } from './SlideContent';
import slides from '@site/static/data/blogPosts.json';

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

export const Carousel = ({ ...props }) => {
  const swiperRef = useRef(null);

  return (
    <div>
      <div className={styles.titleContainer}>
        <h2 className={styles.title}>
          Learn more about React Native ExecuTorch
        </h2>
      </div>
      <div className={styles.container}>
        <SlideButton
          forward={false}
          onClick={() => swiperRef.current?.swiper?.slidePrev()}
        />
        <Swiper
          modules={[Pagination, Autoplay]}
          ref={swiperRef}
          spaceBetween={20}
          slidesPerView={1}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          breakpoints={{
            768: { slidesPerView: 2 },
            1280: { slidesPerView: 3 },
          }}
          // autoplay={{
          //   delay: 4000,
          //   disableOnInteraction: false,
          // }}
          loop={true}
          className={styles.swiper}
          {...props}
        >
          {slides.map((slide) => (
            <SwiperSlide key={slide.id}>
              <SlideContent slide={slide} />
            </SwiperSlide>
          ))}
        </Swiper>
        <SlideButton
          forward={true}
          onClick={() => swiperRef.current?.swiper?.slideNext()}
        />
      </div>
    </div>
  );
};
