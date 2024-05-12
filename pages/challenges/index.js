import Head from 'next/head';
import dynamic from 'next/dynamic';
import React from 'react';
import Playlist from 'C/playlist';
import PlaylistsContainer from 'C/playlistContainer';

const DynamicPlaylist = dynamic(() => import('C/playlist'), {
  suspense: true,
  ssr: false  // Ensure it's only client-side rendered if it involves complex state interactions
});

// const videos = [
//     { id: 1, title: "Marathon Souls ", src: "2107182379", collection: "qCqr4xD3wRdumg" },
//     { id: 2, title: "Playlist Lord of the Fallen", src: "1959635843", collection: "h-7MlnY2kRc5-g" }
// ];

const playlists = [
  {
      title: "Playlist 1",
      videos: [
          { id: 1, title: "Ep.1❄️MARATHON SOULS ALL BOSSES❄️Les 4 jeux à la ZWEIHANDER", thumbnail: "https://static-cdn.jtvnw.net/cf_vods/dgeft87wbj63p/0c40672f3199c1366590_owarida_11654714028_5539955234//thumb/thumb2107182379-320x180.jpg", videoId: "2107182379", collection: "qCqr4xD3wRdumg", url: "https://www.twitch.tv/videos/2107182379?collection=qCqr4xD3wRdumg" },
          { id: 2, title: "Ep.2❄️MARATHON SOULS ALL BOSSES❄️Les 4 jeux à la ZWEIHANDER", thumbnail: "https://static-cdn.jtvnw.net/cf_vods/d1m7jfoe9zdc1j/0d311347ceed1689cfa4_owarida_76406526343_4564151795//thumb/thumb2107182876-320x180.jpg", videoId: "2107182876", collection: "qCqr4xD3wRdumg", url: "https://www.twitch.tv/videos/2107182876?collection=qCqr4xD3wRdumg" },
          { id: 3, title: "Ep.3❄️MARATHON SOULS ALL BOSSES❄️Les 4 jeux à la ZWEIHANDER", thumbnail: "https://static-cdn.jtvnw.net/cf_vods/dgeft87wbj63p/fd0813b66a9e67529f28_owarida_13316461860_4665390885//thumb/thumb2107183284-320x180.jpg", videoId: "2107183284", collection: "qCqr4xD3wRdumg", url: "https://www.twitch.tv/videos/2107183284?collection=qCqr4xD3wRdumg" },
          { id: 4, title: "Video 4", thumbnail: "https://static-cdn.jtvnw.net/cf_vods/dgeft87wbj63p/0c40672f3199c1366590_owarida_11654714028_5539955234//thumb/thumb2107182379-320x180.jpg", videoId: "2107182379", collection: "qCqr4xD3wRdumg", url: "https://www.twitch.tv/videos/2107182379?collection=qCqr4xD3wRdumg" }
      ]
  },
  {
    title: "Playlist 2",
    videos: [
        { id: 1, title: "Ep.1❄️MARATHON SOULS ALL BOSSES❄️Les 4 jeux à la ZWEIHANDER", thumbnail: "https://static-cdn.jtvnw.net/cf_vods/dgeft87wbj63p/0c40672f3199c1366590_owarida_11654714028_5539955234//thumb/thumb2107182379-320x180.jpg", videoId: "2107182379", collection: "qCqr4xD3wRdumg", url: "https://www.twitch.tv/videos/2107182379?collection=qCqr4xD3wRdumg" },
        { id: 2, title: "Ep.2❄️MARATHON SOULS ALL BOSSES❄️Les 4 jeux à la ZWEIHANDER", thumbnail: "https://static-cdn.jtvnw.net/cf_vods/d1m7jfoe9zdc1j/0d311347ceed1689cfa4_owarida_76406526343_4564151795//thumb/thumb2107182876-320x180.jpg", videoId: "2107182876", collection: "qCqr4xD3wRdumg", url: "https://www.twitch.tv/videos/2107182876?collection=qCqr4xD3wRdumg" },
        { id: 3, title: "Ep.3❄️MARATHON SOULS ALL BOSSES❄️Les 4 jeux à la ZWEIHANDER", thumbnail: "https://static-cdn.jtvnw.net/cf_vods/dgeft87wbj63p/fd0813b66a9e67529f28_owarida_13316461860_4665390885//thumb/thumb2107183284-320x180.jpg", videoId: "2107183284", collection: "qCqr4xD3wRdumg", url: "https://www.twitch.tv/videos/2107183284?collection=qCqr4xD3wRdumg" },
        { id: 4, title: "Video 4", thumbnail: "https://static-cdn.jtvnw.net/cf_vods/dgeft87wbj63p/0c40672f3199c1366590_owarida_11654714028_5539955234//thumb/thumb2107182379-320x180.jpg", videoId: "2107182379", collection: "qCqr4xD3wRdumg", url: "https://www.twitch.tv/videos/2107182379?collection=qCqr4xD3wRdumg" }
    ]
},
{
  title: "Playlist 3",
  videos: [
      { id: 1, title: "Ep.1❄️MARATHON SOULS ALL BOSSES❄️Les 4 jeux à la ZWEIHANDER", thumbnail: "https://static-cdn.jtvnw.net/cf_vods/dgeft87wbj63p/0c40672f3199c1366590_owarida_11654714028_5539955234//thumb/thumb2107182379-320x180.jpg", videoId: "2107182379", collection: "qCqr4xD3wRdumg", url: "https://www.twitch.tv/videos/2107182379?collection=qCqr4xD3wRdumg" },
      { id: 2, title: "Ep.2❄️MARATHON SOULS ALL BOSSES❄️Les 4 jeux à la ZWEIHANDER", thumbnail: "https://static-cdn.jtvnw.net/cf_vods/d1m7jfoe9zdc1j/0d311347ceed1689cfa4_owarida_76406526343_4564151795//thumb/thumb2107182876-320x180.jpg", videoId: "2107182876", collection: "qCqr4xD3wRdumg", url: "https://www.twitch.tv/videos/2107182876?collection=qCqr4xD3wRdumg" },
      { id: 3, title: "Ep.3❄️MARATHON SOULS ALL BOSSES❄️Les 4 jeux à la ZWEIHANDER", thumbnail: "https://static-cdn.jtvnw.net/cf_vods/dgeft87wbj63p/fd0813b66a9e67529f28_owarida_13316461860_4665390885//thumb/thumb2107183284-320x180.jpg", videoId: "2107183284", collection: "qCqr4xD3wRdumg", url: "https://www.twitch.tv/videos/2107183284?collection=qCqr4xD3wRdumg" },
      { id: 4, title: "Video 4", thumbnail: "https://static-cdn.jtvnw.net/cf_vods/dgeft87wbj63p/0c40672f3199c1366590_owarida_11654714028_5539955234//thumb/thumb2107182379-320x180.jpg", videoId: "2107182379", collection: "qCqr4xD3wRdumg", url: "https://www.twitch.tv/videos/2107182379?collection=qCqr4xD3wRdumg" },
      { id: 5, title: "Ep.1❄️MARATHON SOULS ALL BOSSES❄️Les 4 jeux à la ZWEIHANDER", thumbnail: "https://static-cdn.jtvnw.net/cf_vods/dgeft87wbj63p/0c40672f3199c1366590_owarida_11654714028_5539955234//thumb/thumb2107182379-320x180.jpg", videoId: "2107182379", collection: "qCqr4xD3wRdumg", url: "https://www.twitch.tv/videos/2107182379?collection=qCqr4xD3wRdumg" },
      { id: 6, title: "Ep.2❄️MARATHON SOULS ALL BOSSES❄️Les 4 jeux à la ZWEIHANDER", thumbnail: "https://static-cdn.jtvnw.net/cf_vods/d1m7jfoe9zdc1j/0d311347ceed1689cfa4_owarida_76406526343_4564151795//thumb/thumb2107182876-320x180.jpg", videoId: "2107182876", collection: "qCqr4xD3wRdumg", url: "https://www.twitch.tv/videos/2107182876?collection=qCqr4xD3wRdumg" },
      
  ]
}
];

function HeadView() {
  return (
    <Head>
      <title>Challenges | Owarida</title>
      <meta name="description" content="Challenges d'Owarida" />
      <link rel="icon" href="/favicon.ico" />
      <meta name="keywords" content="Owarida, challenges, cartes, Owarida Coins, points, elden ring, owarida collect, owacollect" />
    </Head>
  );
}

export default function Challenges() {
  // return (
  //   <>
  //     <HeadView />
  //     <div className="container mx-auto px-4 text-white">
  //       <React.Suspense fallback={<div>Loading...</div>}>
  //         <DynamicPlaylist videos={videos} />
  //       </React.Suspense>
  //     </div>
  //   </>
  // );
  return (
    <div className="container mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-center mb-4">Video Playlists</h1>
        <PlaylistsContainer playlists={playlists} />
    </div>
);
}