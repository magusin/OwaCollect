import axios from "axios";
import React from 'react';
import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/router";
import OwaGif from "C/owaGif";
import Header from "C/header";
import calculatePoints from "@/utils/calculatePoints.js";

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [points, setPoints] = React.useState(0);

  useEffect(() => {

    if (session) {
      const getUser = async () => {
        try {
          const response = await axios.get('/api/user/' + session.user.id);
          const data = await response.data;
          localStorage.setItem('userOC', JSON.stringify(data));
          console.log(localStorage)
          setUser(data);
          const calculatedPoints = calculatePoints(data);
          const totalPoints = calculatedPoints - data.pointsUsed;
          localStorage.setItem('points', totalPoints);
          setPoints(totalPoints);
        } catch (error) {
          setError(error);
        } finally {
          setLoading(false);
        }
      };
      getUser();
    } else {
      setLoading(false);
    }
  }, [session]);

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
        <p>Erreur lors du chargement des informations utilisateur</p>
      </div>
    )
  }

  if (session) {
    return (
      <div className="flex-col content-center items-center h-screen">
        <Header points={points} />
        <p>Connecté en tant que {session.user.name}</p>
        <p>Points: {points}</p>
      </div>
    )
  }
  if (!session) {
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
}