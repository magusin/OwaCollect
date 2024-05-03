import { useSprings, animated } from 'react-spring';
import { useDrag } from 'react-use-gesture';
import { useEffect, useState, useRef } from 'react';
import styles from './index.module.css'; // Assurez-vous de créer ce fichier CSS

const VideoCarousel = () => {
    const videoSet1 = [
      {
        src: 'https://www.youtube.com/embed/3m-rhjP24Ec?si=qHk4iFxnPqdGT-kM',
        className: styles.a
      },
      {
        src: 'https://www.youtube.com/embed/1d9_pgJgFzQ?si=VGxp3VIC8LcIIjlh',
        className: styles.b
      },
      {
        src: 'https://www.youtube.com/embed/H4dGpz6cnHo?si=4WGnM-LjhZdCGB10',
        className: styles.c
      }
    ]
  
    const carouselRef = useRef(null)
  
    const [rotateValue, setRotateValue] = useState(0)
    const [windowWidth, setWindowWidth] = useState(0)
    const [currentVideos, setCurrentVideos] = useState(videoSet1)
    const numberOfVideos = currentVideos.length
    const angle = 360 / numberOfVideos
    
    const handleNext = () => {
      setRotateValue((prev) => prev - angle)
    }
  
    const handlePrev = () => {
      setRotateValue((prev) => prev + angle)
    }
  
    useEffect(() => {
      if (carouselRef.current) {
        const carousel = carouselRef.current
        carousel.style.setProperty('--angle', angle)
        carousel.style.transform = `rotateY(${rotateValue}deg)`
      }
    }, [angle, rotateValue])
  
    useEffect(() => {
      setWindowWidth(window.innerWidth)
      const handleResize = () => setWindowWidth(window.innerWidth)
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }, [])
  
    let videoWidth
    if (windowWidth < 601) {
      videoWidth = 200
    } else if (windowWidth > 600 && windowWidth < 1201) {
      videoWidth = 300
    } else {
      videoWidth = 400
    }
    const radius = (numberOfVideos - 6) * 25 + videoWidth
    const scale = videoWidth / radius
    const buttonMargin = radius - radius / numberOfVideos
  
    return (
      <>
        <div className={styles.carouselContainer}>
          {/* <div className={styles.buttonsBar}>
            <button className={styles.button} onClick={() => {setCurrentVideos(videoSet1); setRotateValue(0); }}  >Set 1</button>
            <button className={styles.button} onClick={() => {setCurrentVideos(videoSet2); setRotateValue(0); }} >Set 2</button>
            <button className={styles.button} onClick={() => {setCurrentVideos(videoSet3); setRotateValue(0); }} >Set 3</button>
            <button className={styles.button} onClick={() => {setCurrentVideos(videoSet4); setRotateValue(0); }} >Set 4</button>
            <button className={styles.button} onClick={() => {setCurrentVideos(videoSet5); setRotateValue(0); }} >Set 5</button>
          </div> */}
          <div ref={carouselRef} className={styles.carousel}>
            {currentVideos.map((video, index) => (
              <div
              
                key={index}
                style={{
                  '--index': index,
                  transform: `rotateY(${
                    angle * index
                  }deg) translateZ(${radius}px) scale(${scale})`
                }}
                className={`${styles.item} ${video.className}`}
              >
                <iframe src={video.src} frameBorder="0" allowFullScreen></iframe>
              </div>
            ))}
          </div>
          <div
            className={styles.next}
            onClick={handleNext}
            style={{ marginRight: `-${buttonMargin}px` }}
          ></div>
          <div
            className={styles.prev}
            onClick={handlePrev}
            style={{ marginLeft: `-${buttonMargin}px` }}
          ></div>
        </div>
      </>
    )
  }
  
  export default VideoCarousel;