// components/TwitchPlayer.js
import React from 'react';

const TwitchPlayer = ({ videoId, collection }) => {
  const parentDomain = process.env.NEXT_PUBLIC_PARENT;

  return (
    <iframe
      src={`https://player.twitch.tv/?collection=${collection}&video=${videoId}&parent=${parentDomain}`}
      width= '100%'
      height= '100%'
      allowFullScreen={true}>
    </iframe>
  );
};

export default TwitchPlayer;