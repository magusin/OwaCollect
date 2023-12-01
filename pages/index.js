import axios from "axios";
import React from 'react';
import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/router";
import OwaGif from "C/owaGif";
import Header from "C/header";
import Link from "next/link";

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  console.log(session);
  //   useEffect(() => {
  //     if (session) {
  //   const subscriptions = async () => {
  //     try {
  //       const response = await axios.get('https://api.twitch.tv/helix/subscriptions', {
  //         headers: {
  //           'Authorization': `Bearer ${session.accessToken}`,
  //           'Client-Id': "jmq642olignuzl4a51lgwmavf5yhcs"
  //         },
  //         params: {
  //           'broadcaster_id': '75524984',
  //           'user_id': session.user.id
  //         }
  //       });
  //       const data = await response.data;
  //       console.log(data);
  //       setSubscriptions(data);
  //     } catch (error) {
  //       console.error('Erreur lors de la récupération des abonnements Twitch:', error);
  //       setError(error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }
  //   subscriptions()
  // }
  // }, [status, router, session]);
  if (status === "loading" || loading) {
    return (
      <div className="flex-col content-center items-center h-screen">
        <Header />
        {/* ajouter spinner */}
        <p>Chargement...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-col content-center items-center h-screen">
        <Header />
        <p>Erreur lors du chargement des produits</p>
      </div>
    )
  }

  if (session) {
    return (
      <div className="flex-col content-center items-center h-screen">
        <Header />
        <p>Connecté en tant que {session.user.name}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col content-center items-center h-screen">
      <Header />
      <div className="flex flex-col h-full w-full justify-center items-center ">
        <OwaGif />
        <button
          className="bg-blue-500 text-white font-bold py-2 px-4 rounded mt-12"
          onClick={() => signIn('twitch')}
        >
          Se connecter avec Twitch
        </button>
      </div>
    </div>
  );
}