import React from 'react';
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/router";
import Header from "C/header";
import calculatePoints from "@/utils/calculatePoints";
import Image from "next/legacy/image";
import { useDarkMode } from "@/contexts/darkModeContext";
import Footer from "C/footer";
import axiosInstance from "@/utils/axiosInstance";
import Head from 'next/head';
import Link from 'next/link';

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [points, setPoints] = React.useState(0);
  const [isFetching, setIsFetching] = React.useState(false);
  const { darkMode } = useDarkMode();

  useEffect(() => {
    if (session && !isFetching) {
      setIsFetching(true);
      //  add flag if create user for cancel multiple call
      const getUser = async () => {
        try {
          const response = await axiosInstance.get(`/api/user`, {
            customConfig: { session: session }
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
            setError('Erreur lors de la récupération des données utilisateur. ' + error.message);
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

  function HeadView() {
    return (
      <Head>
        <title>Owarida Collect | Connectez-vous avec Twitch et gagnez des owarida coins</title>
        <meta name="description" content="Regardez les streams Twitch d'Owarida, gagnez des Owarida Coins, et collectionnez des cartes des jeux FromSoftware." />
        <meta name="keywords" content="owarida, twitch, owarida coins, elden ring, dark souls, jeux vidéos, cartes digitales, récompenses, fromsoft" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
    )
  }

  if (status === "loading" || loading) {
    return (
      <>
        <HeadView />
        <div className="flex flex-col h-screen">
          <Header points={points} />
          <div className="flex-grow flex justify-center items-center">
            <span className="text-center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><path fill="#1f2937" d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"><animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12" /></path></svg></span>
          </div>
          <Footer />
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <HeadView />
        <div className="flex flex-col h-screen">
          <Header points={points} />
          <div className="flex-grow flex justify-center items-center">
            <span className="text-center text-red-500">⚠ {error}</span>
          </div>
          <Footer />
        </div>
      </>
    );
  }

  if (session && user) {
    return (
      <>
        <HeadView />
        <div className="flex flex-col min-h-screen">
          <Header points={points} />

          <div className="flex-grow flex justify-center items-center m-4">
            <div className='mt-4 p-6 border rounded-xl shadow-lg md:mt-0 bg-white border-gray-300 text-gray-900'>
              {/* User Name */}
              <h2 className="text-2xl font-bold text-black text-center mb-4">{user.name}</h2>

              {/* Profile Section */}
              <div className="flex flex-col md:flex-row items-center justify-center">
                {/* User Image */}
                <div className="h-[200px] w-[200px] md:w-[250px] md:h-[250px] lg:w-[300px] lg:h-[300px] overflow-hidden rounded-full shadow-md">
                  <Image
                    src={user.imageUrl}
                    alt={user.name}
                    className="rounded-full object-cover"
                    priority={true}
                    width={300}
                    height={300}
                  />
                </div>

                {/* User Stats */}
                <div className="mt-6 md:mt-0 md:ml-6 flex flex-wrap justify-center md:justify-start gap-4">
                  <div className="bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200 px-4 py-2 rounded-full text-sm font-semibold shadow-sm">
                    Subs: {user.subs}
                  </div>
                  <div className="bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200 px-4 py-2 rounded-full text-sm font-semibold shadow-sm">
                    Messages: {user.messages}
                  </div>
                  <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200 px-4 py-2 rounded-full text-sm font-semibold shadow-sm">
                    Gifts: {user.gifts}
                  </div>
                  <div className="bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200 px-4 py-2 rounded-full text-sm font-semibold shadow-sm">
                    Bits: {user.bits}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </>
    )
  }

  if (!session) {
    return (
      <>
        <HeadView />
        <Header />
        <div
          className="relative flex flex-col w-full justify-center items-center h-[400px] md:h-[500px] xl:h-[550px] 2xl:h-[600px] bg-gray-800"
          style={{
            background: "radial-gradient(circle, #CCCCCC, #0f171b)",

          }}
        >
          {/* Image de fond */}
          <div className="absolute inset-0 z-10">
            <Image
              src="/images/font.png"
              alt="Background"
              layout="fill"
              objectFit="contain" // Remplit le conteneur tout en maintenant les proportions
              objectPosition="cover" // Centre l'image dans le conteneur
              quality={100}
            />
          </div>

          {/* Contenu principal */}
          <div className="z-20 flex flex-col items-center pt-12 pb-12 w-full">
            <div className="relative w-full md:h-[300px] xl:h-[350px] 2xl:h-[400px] h-[250px]">
              <Image
                src="/images/owa.png" // Vérifiez que cette image existe
                alt="Owarida Collect"
                layout="fill"
                objectFit="contain"
                priority={true}
              />
            </div>
            <button
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold py-3 px-6 rounded-full mt-6 hover:scale-105 transition-transform duration-300 shadow-lg"
              onClick={() => signIn("twitch")}
            >
              Se connecter avec Twitch
            </button>
          </div>
        </div>

        {/* Transition avec SVG */}
        <div className="relative h-2 w-full sm:h-8 lg:h-18 bg-gray-800">
          <svg
            className="absolute bottom-0 w-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
          >
            <path
              fill="#0f171b"
              fillOpacity="1"
              d="M0,96L60,117.3C120,139,240,181,360,202.7C480,224,600,224,720,208C840,192,960,160,1080,133.3C1200,107,1320,85,1380,74.7L1440,64L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
            ></path>
          </svg>
        </div>

        {/* Nouvelle section pour expliquer le site */}
        <div className="relative flex flex-col items-center justify-center bg-gray-800 safe px-4 py-12 text-white">
          <h2 className="text-4xl font-bold mb-6 text-center">
            Qu'est-ce qu'Owarida Collect ?
          </h2>
          <p className="text-lg max-w-3xl text-center text-gray-300 leading-relaxed">
            Owarida Collect est la plateforme ultime pour les fans de streams Twitch et des jeux FromSoftware !
            Connectez votre compte Twitch pour transformer vos <span className="text-blue-400 font-semibold">points de chaîne</span> et <span className="text-yellow-400 font-semibold"> abonnements</span> en
            <span className="text-green-400 font-semibold"> Owarida Coins</span>.
            Utilisez ces coins pour débloquer des cartes digitales exclusives et enrichir votre collection,
            avec des designs inspirés des univers épiques comme <span className="text-yellow-400 font-semibold">Elden Ring </span>
            et <span className="text-red-400 font-semibold">Dark Souls</span>.
          </p>
          <div className="flex flex-col xl:flex-row mt-12 gap-6">
            <div className="flex flex-col items-center">
              <Image
                src="/images/Screenshot_2.png"
                alt="Watch Streams"
                width={450}
                height={250}
              />
              <h3 className="text-xl font-semibold mt-4">Regardez les streams</h3>
              <p className="text-center text-gray-400 px-8">
                Regardez les streams Twitch d’<Link className="font-bold underline" href="https://www.twitch.tv/owarida">Owarida</Link> et échangez vos points de chaîne pour obtenir des Owarida Coins. Plus vous participez, plus vous gagnez !
              </p>
            </div>
            {/* <div className="flex flex-col items-center">
              <Image
                src="/images/earn.png"
                alt="Earn Coins"
                width={150}
                height={150}
              />
              <h3 className="text-xl font-semibold mt-4">Gagnez des Owarida Coins</h3>
              <p className="text-center text-gray-400">
                Chaque minute passée sur les streams vous rapporte des points.
              </p>
            </div> */}
            <div className="flex flex-col items-center">
              <Image
                src="/images/Screenshot_1.png"
                alt="Redeem Rewards"
                width={450}
                height={250}
              />
              <h3 className="text-xl font-semibold mt-4">Échangez vos points</h3>
              <p className="text-center text-gray-400 px-8">
                Utilisez vos Owarida Coins pour accéder à des cartes digitales uniques et devenir un véritable collectionneur !
              </p>
            </div>
          </div>
        </div>
      </>
    );

  }
}