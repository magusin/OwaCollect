// components/PlaylistsContainer.js
import React from 'react';
import Playlist from 'C/playlist';

const PlaylistsContainer = ({ playlists }) => {
    return (
        <div>
            {playlists.map((playlist, index) => (
                <Playlist key={index} playlist={playlist} />
            ))}
        </div>
    );
};

export default PlaylistsContainer;