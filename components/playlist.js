import React, { useState } from 'react';
import TwitchPlayer from 'C/twitchPlayer';
import VideoItem from 'C/videoItem';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import SwiperCore, { Navigation } from 'swiper';
// const Playlist = ({ videos }) => {
//   const [currentVideo, setCurrentVideo] = useState(videos[0]);

//   return (
//     <div className="flex">
//       <div className="flex-grow">
//         {/* Utilisez TwitchPlayer */}
//         <TwitchPlayer videoId={currentVideo.src} collection={currentVideo.collection} />
//       </div>
//       <div className="w-1/4 bg-gray-800 h-screen overflow-auto">
//         {videos.map(video => (
//           <div key={video.id} className="p-4 hover:bg-gray-700 cursor-pointer" onClick={() => setCurrentVideo(video)}>
//             {video.title}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// Installer les modules Swiper nécessaires
SwiperCore.use([Navigation]);

const Playlist = ({ playlist, index }) => {
  // Des identifiants uniques pour chaque instance de Swiper
  // const nextButtonRef = `swiper-button-next-${index}`;
  // const prevButtonRef = `swiper-button-prev-${index}`;
  return (
      <div className="mb-8 relative">
          <h2 className="text-xl font-bold mb-4">{playlist.title}</h2>
          <Swiper
              spaceBetween={20}
              slidesPerView={3}
            //   navigation={{
            //     nextEl: `.${nextButtonRef}`,
            //     prevEl: `.${prevButtonRef}`,
            // }}
              loop={true}
              observer={true}
              observeParents={true}
              parallax={true}
          >
              {playlist.videos.map(video => (
                  <SwiperSlide key={video.id}>
                      <a href={video.url} target="_blank" rel="noopener noreferrer">
                          <div className="aspect-w-16 aspect-h-9">
                              <img src={video.thumbnail} alt={video.title} className="object-cover" />
                          </div>
                          <p className="text-center mt-2">{video.title}</p>
                      </a>
                  </SwiperSlide>
              ))}
          </Swiper>
          {/* <div className={`swiper-button-next ${nextButtonRef}`}></div> */}
            {/* <div className={`swiper-button-prev ${prevButtonRef}`}></div> */}
      </div>
  );
};

export default Playlist;