import axios from "axios";
import React from 'react';
import { signIn, signOut, useSession } from "next-auth/react";
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
          const totalPoints = calculatePoints(data);
          localStorage.setItem('points', totalPoints);
          setPoints(totalPoints);
        } catch (error) {
          if (error.response.status === 401) {
            setError('Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.')
            setTimeout(() => {
              signOut()
              router.push('/');
            }, 2000);
          } else {
          setError('Erreur lors de la récupération des données utilisateur. ' + error);
          }
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
        <div className="flex flex-col h-screen">
            <Header points={points} /> 
            <div className="flex-grow flex justify-center items-center">
              <span className="text-center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><path fill="#1f2937" d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"><animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></path></svg></span>
            </div>
        </div>
    )
}

  if (error) {
    return (
        <div className="flex flex-col h-screen">
            <Header points={points} /> 
            <div className="flex-grow flex justify-center items-center">
                <span className="text-center text-red-500">⚠ {error}</span>
            </div>
        </div>
    );
}

  if (session && user) {

    return (
      <div className="flex flex-col h-screen">
        <Header points={points} />
        <div className="relative flex-grow flex justify-center items-center">
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
        <div className="flex flex-col h-full w-full justify-center items-center" style={{ background: 'radial-gradient(circle, #CCCCCC, #0f171b)' }}>          
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