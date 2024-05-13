import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import SwiperCore, { Navigation } from 'swiper';

// Installer les modules Swiper nécessaires
SwiperCore.use([Navigation]);

const Playlist = ({ playlist, index }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtre les vidéos en fonction du titre et du terme de recherche
  const filteredVideos = playlist.videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
      <div className="mb-8 relative">
          <h2 className="text-xl font-bold mb-4">{playlist.title}</h2>
          <input
            type="text"
            placeholder="Search by title..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="mb-4 p-2 border border-gray-300 rounded"
            style={{color: "#222"}}
          />
          <Swiper
              spaceBetween={20}
              slidesPerView={3}
              loop={true}
              observer={true}
              observeParents={true}
              parallax={true}
          >
              {filteredVideos.map(video => (  // Correction made here
                  <SwiperSlide key={video.id}>
                      <a href={video.url} target="_blank" rel="noopener noreferrer">
                          <div className="aspect-w-16 aspect-h-9">
                              <img src={video.thumbnail} alt={video.title} className="object-cover" />
                          </div>
                          <p className="text-center mt-2" style={{color: "#FF4A1C"}}>{video.title}</p>
                      </a>
                  </SwiperSlide>
              ))}
          </Swiper>
      </div>
  );
};

export default Playlist;