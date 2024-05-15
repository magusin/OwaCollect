import Head from 'next/head';
import dynamic from 'next/dynamic';
import React, { useEffect } from 'react';
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
    title: "Marathon Souls",
    videos: [
      { id: 1, title: "Ep.1❄️MARATHON SOULS ALL BOSSES❄️Les 4 jeux à la ZWEIHANDER", thumbnail: "https://static-cdn.jtvnw.net/cf_vods/dgeft87wbj63p/0c40672f3199c1366590_owarida_11654714028_5539955234//thumb/thumb2107182379-320x180.jpg", videoId: "2107182379", collection: "qCqr4xD3wRdumg", url: "https://www.twitch.tv/videos/2107182379?collection=qCqr4xD3wRdumg" },
      { id: 2, title: "Ep.2❄️MARATHON SOULS ALL BOSSES❄️Les 4 jeux à la ZWEIHANDER", thumbnail: "https://static-cdn.jtvnw.net/cf_vods/d1m7jfoe9zdc1j/0d311347ceed1689cfa4_owarida_76406526343_4564151795//thumb/thumb2107182876-320x180.jpg", videoId: "2107182876", collection: "qCqr4xD3wRdumg", url: "https://www.twitch.tv/videos/2107182876?collection=qCqr4xD3wRdumg" },
      { id: 3, title: "Ep.3❄️MARATHON SOULS ALL BOSSES❄️Les 4 jeux à la ZWEIHANDER", thumbnail: "https://static-cdn.jtvnw.net/cf_vods/dgeft87wbj63p/fd0813b66a9e67529f28_owarida_13316461860_4665390885//thumb/thumb2107183284-320x180.jpg", videoId: "2107183284", collection: "qCqr4xD3wRdumg", url: "https://www.twitch.tv/videos/2107183284?collection=qCqr4xD3wRdumg" },
      { id: 4, title: "Ep.4❄️MARATHON SOULS ALL BOSSES❄️Les 4 jeux à la ZWEIHANDER", thumbnail: "https://static-cdn.jtvnw.net/cf_vods/dgeft87wbj63p/227aaf440961c5ace33b_owarida_16482795038_4272637631//thumb/thumb2107183740-320x180.jpg", videoId: "2107183740", collection: "qCqr4xD3wRdumg", url: "https://www.twitch.tv/videos/2107183740?collection=qCqr4xD3wRdumg" },
      { id: 5, title: "Ep.5❄️MARATHON SOULS ALL BOSSES❄️Les 4 jeux à la ZWEIHANDER", thumbnail: "https://static-cdn.jtvnw.net/cf_vods/d1m7jfoe9zdc1j/7a0a36330d50fc4dc4c4_owarida_80197141810_1637919578//thumb/thumb2107184216-320x180.jpg", videoId: "2107184216", collection: "qCqr4xD3wRdumg", url: "https://www.twitch.tv/videos/2107184216?collection=qCqr4xD3wRdumg"},
      { id: 6, title: "Ep.6❄️MARATHON SOULS ALL BOSSES❄️Les 4 jeux à la ZWEIHANDER", thumbnail: "https://static-cdn.jtvnw.net/cf_vods/dgeft87wbj63p/e759dffab1b8216cbb17_owarida_29659123663_4648250091//thumb/thumb2107184723-320x180.jpg", videoId: "2107184723", collection: "qCqr4xD3wRdumg", url: "https://www.twitch.tv/videos/2107184723?collection=qCqr4xD3wRdumg"},
      { id: 7, title: "Ep.7❄️MARATHON SOULS ALL BOSSES❄️Les 4 jeux à la ZWEIHANDER", thumbnail: "https://static-cdn.jtvnw.net/cf_vods/d1m7jfoe9zdc1j/edbdbc36df5542cdf3c7_owarida_25753310384_5161605707//thumb/thumb2107185154-320x180.jpg", videoId: "2107185154", collection: "qCqr4xD3wRdumg", url: "https://www.twitch.tv/videos/2107185154?collection=qCqr4xD3wRdumg"},
      { id: 8, title: "Ep.8❄️MARATHON SOULS ALL BOSSES❄️Les 4 jeux à la ZWEIHANDER", thumbnail: "https://static-cdn.jtvnw.net/cf_vods/d1m7jfoe9zdc1j/ef6bd8aa1c2814359a6b_owarida_38804671217_2382836987//thumb/thumb2107185537-320x180.jpg", videoId: "2107185537", collection: "qCqr4xD3wRdumg", url: "https://www.twitch.tv/videos/2107185537?collection=qCqr4xD3wRdumg"},
      { id: 9, title: "Ep.9❄️MARATHON SOULS ALL BOSSES❄️Les 4 jeux à la ZWEIHANDER", thumbnail: "https://static-cdn.jtvnw.net/cf_vods/dgeft87wbj63p/cadfe24f530c71632e0a_owarida_72873213925_9033194449//thumb/thumb2107185934-320x180.jpg", videoId: "2107185934", collection: "qCqr4xD3wRdumg", url: "https://www.twitch.tv/videos/2107185934?collection=qCqr4xD3wRdumg"},
      { id: 10, title: "Ep.10❄️MARATHON SOULS ALL BOSSES❄️Les 4 jeux à la ZWEIHANDER", thumbnail: "https://static-cdn.jtvnw.net/cf_vods/dgeft87wbj63p/ae5f8e88e59fa5b16a3c_owarida_79926792196_1588494808//thumb/thumb2107187681-320x180.jpg", videoId: "2107187681", collection: "qCqr4xD3wRdumg", url: "https://www.twitch.tv/videos/2107187681?collection=qCqr4xD3wRdumg"},
    ]
  },
  {
    title: "Lords of the Fallen",
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
    <>
      <HeadView />
      {/* Div englobante avec style complet */}
      <div className="min-h-screen w-full" style={{ backgroundColor: "#2B2D42", color: "#FF4A1C" }}>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-center mb-4 uppercase">Video Playlists</h1>
          <PlaylistsContainer playlists={playlists} />
        </div>
      </div>
    </>
  );
}