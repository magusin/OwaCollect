// components/VideoItem.js
import React from 'react';

const VideoItem = ({ video }) => {
    const openInNewTab = (url) => {
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        if (newWindow) newWindow.opener = null;
    };

    return (
        <div className="p-4 shadow-lg rounded-lg cursor-pointer" onClick={() => openInNewTab(video.url)}>
            <img src={video.thumbnail} alt={video.title} className="w-full h-auto object-cover rounded-lg transition duration-200 ease-in-out transform hover:scale-105" />
            <h3 className="mt-2 text-center">{video.title}</h3>
        </div>
    );
};

export default VideoItem;