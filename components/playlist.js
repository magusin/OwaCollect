import React, { useState } from 'react';
import TwitchPlayer from 'C/twitchPlayer';

const Playlist = ({ videos }) => {
  const [currentVideo, setCurrentVideo] = useState(videos[0]);

  return (
    <div className="flex">
      <div className="flex-grow">
        {/* Utilisez TwitchPlayer au lieu de VideoPlayer */}
        <TwitchPlayer videoId={currentVideo.src} collection={currentVideo.collection} />
      </div>
      <div className="w-1/4 bg-gray-800 h-screen overflow-auto">
        {videos.map(video => (
          <div key={video.id} className="p-4 hover:bg-gray-700 cursor-pointer" onClick={() => setCurrentVideo(video)}>
            {video.title}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Playlist;