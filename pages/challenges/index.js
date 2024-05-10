import Head from 'next/head';
import dynamic from 'next/dynamic';
import React from 'react';

const DynamicPlaylist = dynamic(() => import('C/playlist'), {
  suspense: true,
  ssr: false  // Ensure it's only client-side rendered if it involves complex state interactions
});

const videos = [
    { id: 1, title: "Marathon Souls ", src: "2107182379", collection: "qCqr4xD3wRdumg" },
    { id: 2, title: "Playlist Lord of the Fallen", src: "1959635843", collection: "h-7MlnY2kRc5-g" }
];

function HeadView() {
  return (
    <Head>
      <title>Collection | Owarida</title>
      <meta name="description" content="Challenges d'Owarida" />
      <link rel="icon" href="/favicon.ico" />
      <meta name="keywords" content="Owarida, challenges, cartes, Owarida Coins, points, elden ring, owarida collect, owacollect" />
    </Head>
  );
}

export default function Challenges() {
  return (
    <>
      <HeadView />
      <div className="container mx-auto px-4">
        <React.Suspense fallback={<div>Loading...</div>}>
          <DynamicPlaylist videos={videos} />
        </React.Suspense>
      </div>
    </>
  );
}