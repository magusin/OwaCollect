import React, { useState, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import SwiperCore, { Navigation } from 'swiper';
import Head from 'next/head';

// Installer les modules Swiper nécessaires
SwiperCore.use([Navigation]);

function HeadView() {
  return (
    <Head>
      <title>Collection | Owarida</title>
      <meta name="description" content="Collection de cartes Owarida" />
      <link rel="icon" href="/favicon.ico" />
      <meta name="keywords" content="Owarida, collection, cartes, Owarida Coins, points, elden ring, owarida collect, owacollect" />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css"
      />
    </Head>
  );
}

const Playlist = ({ playlist }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const swiperRef = useRef(null);

  // Filtre les vidéos en fonction du titre et du terme de recherche
  const filteredVideos = playlist.videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fonctions de navigation
  const onSlidePrev = () => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slidePrev();
    }
  };

  const onSlideNext = () => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slideNext();
    }
  };

  return (
    <>
      <HeadView />
      <div className="mb-8 relative">
        <h2 className="text-xl font-bold mb-4">{playlist.title}</h2>
        <input
          type="text"
          placeholder="Search by title..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="mb-4 p-2 border border-gray-300 rounded"
          style={{ color: "#222" }}
        />
        <Swiper
          ref={swiperRef}
          spaceBetween={20}
          slidesPerView={3}
          loop={true}
          observer={true}
          observeParents={true}
          parallax={true}
          navigation={false} // Désactiver la navigation par défaut
        >
          {filteredVideos.map(video => (
            <SwiperSlide key={video.id}>
              <a href={video.url} target="_blank" rel="noopener noreferrer">
                <div className="aspect-w-16 aspect-h-9">
                  <img src={video.thumbnail} alt={video.title} className="object-cover" />
                </div>
                <p className="text-center mt-2" style={{ color: "#FEF6C9", wordWrap: "break-word" }}>{video.title}</p>
              </a>
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="swiper-button-next z-10" onClick={onSlideNext} style={{ color: '#fff', cursor: 'pointer' }}></div> {/* Ajouter des styles pour la visibilité */}
        <div className="swiper-button-prev z-10" onClick={onSlidePrev} style={{ color: '#fff', cursor: 'pointer' }}></div> {/* Ajouter des styles pour la visibilité */}
      </div>
    </>
  );
};

export default Playlist;
