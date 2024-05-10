// components/VideoPlayer.js
import Video from 'next-video';

const VideoPlayer = ({ src }) => {
  return (
    <Video src={src} controls width="100%" />
  );
};

export default VideoPlayer;