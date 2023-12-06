import axios from "axios";
import React from 'react';
import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/router";
import OwaGif from "C/owaGif";
import Header from "C/header";
import calculatePoints from "@/utils/calculatePoints";
import TwitchUserInfo from "@/components/twitchUserInfo";
import Image from "next/legacy/image";

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [points, setPoints] = React.useState(0);
  const [isFetching, setIsFetching] = React.useState(false);
  
  useEffect(() => {
    if (session && !isFetching) {
      console.log(session)
      setIsFetching(true);
      //  add flag if create user for cancel multiple call
      const getUser = async () => {
        try {
          const response = await axios.get(`/api/user`, {
            headers: {
              Authorization: `Bearer ${session.customJwt}`,
            },
          });
          const data = await response.data;
          localStorage.setItem('userOC', JSON.stringify(data));
          setUser(data);
          const calculatedPoints = calculatePoints(data);
          const totalPoints = calculatedPoints - data.pointsUsed;
          localStorage.setItem('points', totalPoints);
          setPoints(totalPoints);
        } catch (error) {
          setError(error);
        } finally {
          setLoading(false);
          setIsFetching(false);
        }
      };
      getUser();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (session && user) {
    // console.log(JSON.parse(localStorage.getItem('nextauth.message')))
    const point = 500
    const editUser = async () => {
      try {
          const response = await fetch('/api/user', { 
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${session.customJwt}`,
              },
              body: JSON.stringify({ 
                  pointsUsed: point
              })
          })
          // console.log('response:', response)
          const data = await response.json();
          // console.log('data:', data)
      } catch (error) {
          setError(error);
      }
  };
  // editUser();
    return (
      <div className="flex-col content-center items-center justify-center h-screen">
        <Header points={points} />
        <div className="relative w-full h-screen flex justify-center items-center">
        <Image 
            src="/images/twitchuser.png" 
            alt="Fond" 
            layout="fill" 
            objectFit="cover" 
            priority={true} 
          />            
          <div className="absolute" style={{ width: 'calc(100% - 4rem)', top: 'calc(50%)', left: 'calc(50% + 2rem)', transform: 'translate(-50%, -50%)' }}>
            <TwitchUserInfo userData={user} />
            </div>
          </div>
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