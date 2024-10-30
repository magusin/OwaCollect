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
              6:42
            </li>
            <li>
              10:09
            </li>
          </ul>
        </div>;
      case 'Porte Scellée':
        return <div>
          <p>Une porte d'apparence classique mais impossible de l'ouvrir, je n'ai trouvé aucune clef. J'ai même essayé de l'enfoncer mais rien n'y fais, elle semble protégée par plus que du bois.</p>
        </div>
      case 'Machine à écrire':
        return <div>
          <p>Une vieille machine à écrire encore fonctionnelle.</p>
          <p>J'ai remarqué une chose étrange, certaines touches du clavier son inverssées : </p>
          <ul>
            <li>
              L à la place du A
            </li>
            <li>
              B à la place du L
            </li>
            <li>
              E à la place du B
            </li>
            <li>
              M à la place du E
            </li>
            <li>
              O à la place du M
            </li>
            <li>
              P à la place du O
            </li>
            <li>
              I à la place du P
            </li>
            <li>
              R à la place du I
            </li>
            <li>
              T à la place du R
            </li>
            <li>
              U à la place du T
            </li>
            <li>
              V à la place du U
            </li>
            <li>
              S à la place du V
            </li>
            <li>
              N à la place du S
            </li>
            <li>
              A à la place du N
            </li>
          </ul>
        </div>
      case 'Livre':
        return (
          <div className="flex flex-col items-center">
            <p>En feuilletant le livre poussiéreux sur le bureau j'ai retranscris pour vous les pages qui avec le temps pouvait être encore lisible.</p>
            {/* Menu des pages du livre */}
            <div className="flex flex-wrap overflow-x-auto space-x-4 mt-4 mb-6">
              {[1, 2, 3, 5, 8, 13, 21].map((num, index) => (
                <button
                  key={index}
                  className={`px-4 py-2 m-2 border rounded ${selectedPage === num ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  onClick={() => setSelectedPage(num)}
                >
                  Page {num}
                </button>
              ))}
            </div>
            {/* Contenu des pages du livre */}
            <div className="p-4 bg-gray-100 rounded shadow-md text-left">
              {selectedPage === 1 && (
                <div>
                  <p>Je suis Eléna Maudie PAMEQELLIE, j'écris ces pages pour laisser une trace des événements qui se déroulent ici. Plus le temps passe, plus je me dis que la solution est toute trouvée.</p>
                  <p>Je dois absolument sceller cette porte, et pour que le code soit à jamais hors de portée, je l'ai fondé sur les mouvements du temps lui-même. Le temps avance, et ainsi change le code, rendant chaque tentative de l'obtenir plus hasardeuse, plus périlleuse. Seuls ceux qui saisissent le rythme du temps peuvent espérer ouvrir ce qui, pour la sécurité de tous, devrait demeurer scellé.</p>
                </div>
              )}
              {selectedPage === 2 && (
                <div>
                  <p>Quand je suis arrivée ici, je n'avais aucune idée de comment cela s'était produit. Pourtant, il était impératif que rien ne puisse me suivre.</p>
                  <p>Cette endroit recèle d'objets singuliers, et parmis eux j'ai trouvé une machine pour écrire et j'ai adoré cette outil; elle permet d'écrire les histoires et me servira a ouvrir la porte pour repartir et terminer ma propre histoire ici.</p>
                  <p>Elle évoque aussi le souvenir de mon frère, lui qui n'a jamais renoncé à sauver les siens, même lorsque les ténèbres semblaient tout engloutir.</p>
                </div>
              )}
              {selectedPage === 3 && (
                <div>
                  <p>Les jours passent, et le poids de ma tâche s'alourdit. Mon esprit est partagé entre les souvenirs de ce que j’ai perdu et la réalité de ce que je dois encore accomplir.</p>
                  <p>La porte devant moi est un rappel constant que ce n’est pas seulement la lumière que nous protégeons ici, mais les âmes de ceux qui ne peuvent plus se défendre. Si quelqu'un découvre ces pages, qu'il sache qu'il existe toujours un espoir. Ne laissez jamais le Voile éternel vous submerger.</p>
                </div>
              )}
              {selectedPage === 5 && (
                <div>
                  <p>La corruption qui consumme lentement mon corps est incurable, c'est un fardeau que je dois porter chaque jour, mais je ne peux pas laisser cet obstacle me détourner de ma mission. </p>
                  <p>Le lieu derrière cette porte est un sanctuaire pour moi, en l'honneur de mon frère; un être empli de compassion et de pouvoir, qui aurait tout donné pour voir la corruption éradiquée.</p>
                  <p>Le Voile est constament en mouvements et même si l'insertitude de ses mouvements le rend imprévisible, il demeure certain qu'il finira par arriver à destination et peu importe la destination.</p>
                </div>
              )}
              {selectedPage === 8 && (
                <div>
                  <p>Une simple action peut radicalement changer notre réalité, on dit souvent qu'un battement d'aile de Volkornes au bout du monde peut provoquer une tempête chez nous. Ce phénomène est appelé "l'effet Volkorne".</p>
                  <p>Ce concept illustre de manière poétique comment nos actions, même les plus petites, peuvent avoir des conséquences considérables. Chaque décision, chaque geste, aussi insignifiant semble-t-il, peut résonner au-delà de ce que nous percevons. En agissant avec conscience et en prenant en compte l'impact que nous avons sur les autres, nous devenons un peu comme ce Volkorne, capables de provoquer des changements positifs autour de nous tout autant que des négatifs.</p>
                  <p>Avoir scellé cette porte est pour moi une solution pour limiter d'éventuelles répercutions qui je le sais déjà, seront loin d'être négligeables.</p>
                </div>
              )}
              {selectedPage === 13 && (
                <div>
                  <p>On dit souvent que le passé fini par nous rattraper, et c'est ironique de voir comment les évènements peuvent se reproduire.</p>
                  <p>A toujours vouloir apporter la lumière comment ignorer sans cesse la noirceur en moi ?</p>
                  <p>Et c'est une noirceur identique qui aujourd'hui me pourssuit.</p>
                </div>
              )}
              {selectedPage === 21 && (
                <div>
                  <p>La porte est scellée, j'ai enfin terminé. Je sais que le temps finira par rendre son ouverture plus aisée mais c'est tant mieux, si quelqu'un en a un jour la force il pourra annihiler le Voile.</p>
                  <p>Je vais bientôt pouvoir retrouver les miens et laisser cette endroit en sachant que j'ai fais mon maximum pour le protéger.</p>
                  <p>J'ai laissé des tablettes, la première est la solution pour ouvrir la porte, les suivantes pour le Lord que j'ai croisé un jour.</p>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (session) {
    return (
      <>
        <Header points={points} />
        <div className="flex flex-col items-center justify-center min-h-screen p-4" style={{ marginTop: "80px" }}>
          <p className='m-4'>J'ai découverts cette maison qui semble abandonnée au fond de la ruelle, j'arrive directement dans cette pièce et je ne parviens pas à ouvrir la porte. Je sens une aura étrange se dégager de ces lieux. J'ai fouillé toute la pièce dans ses moindres recoins et je tout relevé, je vous laisse investiguer. </p>
          <p>Respectueusement, votre Scribe.</p>
          {/* <p>Le Scribe</p> */}
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
                {/* Horloge interactive */}
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

              <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 1920 1080">
                {/* Commode interactive */}
                <path
                  d="M 485 780 L 550 700, 555 685, 560 680, 770 690, 770 945, 760 950, 755 955, 750 1030, 700 1032, 500 1000  Z"
                  fill="transparent"
                  stroke="transparent"
                  strokeWidth="4"
                  className="cursor-pointer pointer-events-auto"
                  onClick={() => setSelectedItem('Commode')}
                  onMouseEnter={(e) => e.target.setAttribute('stroke', 'blue')}
                  onMouseLeave={(e) => e.target.setAttribute('stroke', 'transparent')}
                />
              </svg>

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
              <div className="p-6 bg-white rounded shadow-lg text-center m-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-semibold mb-4">{selectedItem}</h2>
                <section>{getInstruction(selectedItem)}</section>
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