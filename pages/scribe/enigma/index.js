// Fichier principal de la page (par exemple pages/interactive-room.js)
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Head from 'next/head';
import Header from 'C/header';
import Footer from 'C/footer';
import { useRouter } from 'next/router';
import { signOut, useSession } from 'next-auth/react';
import axiosInstance from 'utils/axiosInstance';
import calculatePoints from 'utils/calculatePoints';

export default function InteractiveRoom() {
  const { data: session, status } = useSession();
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedPage, setSelectedPage] = useState(0);
  const router = useRouter();
  const [points, setPoints] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }

    if (localStorage.getItem('points') != null) {
      setPoints(localStorage.getItem('points'))
    }

    if (localStorage.getItem('points') === null && localStorage.getItem('userOC') != null) {
      const user = JSON.parse(localStorage.getItem('userOC'));
      const calculatedPoints = calculatePoints(user);
      const totalPoints = calculatedPoints - user.pointsUsed;
      localStorage.setItem('points', totalPoints);
      setPoints(totalPoints);
    }

    if (localStorage.getItem('userOC') === null && session) {
      const getUser = async () => {
        try {
          const response = await axiosInstance.get('/api/user', {
            customConfig: { session: session }
          });
          const data = await response.data;
          localStorage.setItem('userOC', JSON.stringify(data));
          const calculatedPoints = calculatePoints(data);
          const totalPoints = calculatedPoints - data.pointsUsed;
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
            setError(error.response?.data?.message || error.message);
          }
        }
      };
      getUser();
    }
  }, [status, session]);

  const getInstruction = (item) => {
    switch (item) {
      case 'Horloge':
        return <div>
          <p>Les horloges sont usées, toutes arrêtées, les chiffres romains indiquants les heures sont effacés ou les aiguilles manquantes. Mais pour celles que j'ai pu lire j'ai noté les chiffres.</p>
          <ul>
            <li>
              3:15
            </li>
            <li>
              7:30
            </li>
            <li>
              8:42
            </li>
            <li>
              10:09
            </li>
          </ul>
        </div>;
      case 'Porte scellée':
        return "La porte est scellée avec un cadenas complexe. Vous devez trouver le code caché dans la pièce pour l'ouvrir.";
        case 'Livre':
          return (
            <div className="flex flex-col items-center">
              
                {/* Menu des pages du livre */}
                <div className="flex overflow-x-auto space-x-4 mt-4 mb-6">
                  {[1,2,3,5,8,13,21].map((num, index) => (
                    <button
                      key={index}
                      className={`px-4 py-2 border rounded ${selectedPage === index ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                      onClick={() => setSelectedPage(index)}
                    >
                      Page {num}
                    </button>
                  ))}
                </div>
                {/* Contenu des pages du livre */}
                <div className="p-4 bg-gray-100 rounded shadow-md text-center">
                  {selectedPage === 0 && (
                    <p>Page 1: En feuilletant le livre poussiéreux sur le bureau, vous découvrez plusieurs pages avec des annotations énigmatiques. La première page est marquée par une citation : 'Le temps est une boucle, tout finit là où cela a commencé'.</p>
                  )}
                  {selectedPage === 1 && (
                    <p>Page 2: Des dessins de symboles apparaissent sur cette page, dont l'interprétation semble cruciale pour avancer.</p>
                  )}
                  {selectedPage === 2 && (
                    <p>Page 3: La troisième page contient une série de chiffres : 13, 21, 34. Peut-être un code caché ?</p>
                  )}
                  {selectedPage === 3 && (
                    <p>Page 4: Une phrase énigmatique attire votre attention : 'La clé réside dans la somme des éléments'.</p>
                  )}
                  {selectedPage === 4 && (
                    <p>Page 5: Cette page est presque entièrement déchirée, mais les mots 'fin' et 'début' sont encore visibles.</p>
                  )}
                </div>
              </div>
          );
      default:
        return "";
    }
  };

  if (session) {
    return (
      <>
        <Header points={points} />
      <div className="flex flex-col items-center justify-center min-h-screen p-4" style={{ marginTop: "80px" }}>
        <p className='m-4'>J'ai découverts cette maison qui semble abandonnée au fond de la ruelle, j'arrive directement dans cette pièce et je ne parviens pas à ouvrir la porte. Je sens une aura étrange se dégager de ces lieux. </p>
        {/* Image de la salle */}
        <div className="relative w-full max-w-screen-lg h-auto mb-4 flex items-center justify-center">
          <div className="relative w-full h-auto"> {/* Maintien le ratio 16/9 */}
            <Image
              src="/images/enigma.webp"
              alt="Salle interactive"
              layout="responsive"
              width={1920}
              height={1080}
              objectFit="contain"
              quality={100} // Amélioration de la qualité de l'image
              className="rounded-lg"
            />

            {/* SVG interactif par-dessus l'image */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 1920 1080">
              {/* Horloge interactive en utilisant un path personnalisé */}
              <path
                d="M 400 -80 L 450 -110, 1210 -420, 1980 -420, 1980 550, 1320 550, 1320 400 Q 970 -400, 760 400 L 760 550, 360 550 Z"
                fill="transparent"
                stroke="transparent"
                strokeWidth="4"
                className="cursor-pointer pointer-events-auto"
                onClick={() => setSelectedItem('Horloge')}
                onMouseEnter={(e) => e.target.setAttribute('stroke', 'blue')}
                onMouseLeave={(e) => e.target.setAttribute('stroke', 'transparent')}
              />
            </svg>

            {/* Miroir interactif */}
            <div
              className="absolute top-[25%] right-[20%] w-[10%] h-[15%] cursor-pointer border-8 border-indigo-600"
              onClick={() => setSelectedItem('Miroir')}
            />

            {/* Porte scellée interactive */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 1920 1080">
              <path
                d="M 820 1050 L 820 550 A 218 320 0 1 1 1250 550 L 1250 930, 1100 1000, 1100 1100 Z"
                fill="transparent"
                stroke="transparent"
                strokeWidth="4"
                className="cursor-pointer pointer-events-auto"
                onClick={() => setSelectedItem('Porte Scellée')}
                onMouseEnter={(e) => e.target.setAttribute('stroke', 'blue')}
                onMouseLeave={(e) => e.target.setAttribute('stroke', 'transparent')}
              />
            </svg>

            {/* Livre */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 1920 1080">
              <path
                d="M 300 1370, L 900 1580, 1090 1300, 800 1210, 550 1200 Z"
                fill="transparent"
                stroke="transparent"
                strokeWidth="4"
                className="cursor-pointer pointer-events-auto"
                onClick={() => setSelectedItem('Livre')}
                onMouseEnter={(e) => e.target.setAttribute('stroke', 'blue')}
                onMouseLeave={(e) => e.target.setAttribute('stroke', 'transparent')}
              />
            </svg>

            {/* Machine à écrire */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 1920 1080">
              <path
                d="M 1050 1270, L 1350 1400, 1540 1240, 1540 1120, 1610 1100, 1610 1020, 1510 1010, 1540 950, 1320 912, 1280 960, 1200 950, 1160 990, 1160 1020, 1118 1052, 1145 1062, 1145 1150, 1050 1240 Z"
                fill="transparent"
                stroke="transparent"
                strokeWidth="4"
                className="cursor-pointer pointer-events-auto"
                onClick={() => setSelectedItem('Machine à écrire')}
                onMouseEnter={(e) => e.target.setAttribute('stroke', 'blue')}
                onMouseLeave={(e) => e.target.setAttribute('stroke', 'transparent')}
              />
            </svg>
          </div>
        </div>
        {selectedItem && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="p-6 bg-white rounded shadow-lg text-center m-6">
            <h2 className="text-2xl font-semibold mb-4">{selectedItem}</h2>
            <p>{getInstruction(selectedItem)}</p>
            <button
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
              onClick={() => setSelectedItem(null)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
      </div>
        <Footer />
      </>
    );
  }
}