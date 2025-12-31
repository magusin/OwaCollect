import React, { useEffect } from "react";
import axios from "axios";
import { signOut, useSession, getSession } from "next-auth/react";
import { useRouter } from "next/router";
import Header from "C/header";
import Image from "next/legacy/image";
import calculatePoints from "@/utils/calculatePoints";
import { useDarkMode } from "@/contexts/darkModeContext";
import Alert from "C/alert";
import Modal from "C/modal";
import Footer from "C/footer";
import axiosInstance from "@/utils/axiosInstance";
import Head from "next/head";

export default function Blacksmith({ cards, totalPoints, errorServer }) {
  const [error, setError] = React.useState(errorServer || null);
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = React.useState(false);
  const [points, setPoints] = React.useState(totalPoints || 0);

  // ⚠️ Normalisation : ton SSR renvoie une shape "plate"
  // mais ton endpoint forge peut renvoyer une shape imbriquée.
  const normalizePlayerCards = (list = []) =>
    (list ?? []).map((x) => {
      // déjà "plat"
      if (!x?.card) return x;

      // shape imbriquée { count, card: {...} }
      return {
        ...x.card,
        count: x.count,
        isGold: x.isGold ?? x.card.isGold,
        isNew: x.isNew ?? x.card.isNew,
        isInDeck: x.isInDeck ?? x.card.isInDeck,
        owned: x.owned ?? x.card.owned,
      };
    });

  const [playerCards, setPlayerCards] = React.useState(() =>
    normalizePlayerCards(cards?.playerCards ?? [])
  );

  const { darkMode } = useDarkMode();

  const [alertMessage, setAlertMessage] = React.useState("");
  const [showAlert, setShowAlert] = React.useState(false);
  const [alertType, setAlertType] = React.useState(null);

  const [showModal, setShowModal] = React.useState(false);
  const [cardToForge, setCardToForge] = React.useState(null);

  const [selectedCard, setSelectedCard] = React.useState(null);
  const [selectedCategory, setSelectedCategory] = React.useState("Elden Ring");

  const handleForgeCard = (card) => {
    setCardToForge(card);
    setShowModal(true);
  };

  const closeEnlargeView = () => {
    setSelectedCard(null);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleConfirmForgeCard = async (id) => {
    setLoading(true);
    setShowModal(false);

    try {
      const response = await axiosInstance.put(
        "/api/user/card/forge",
        { id },
        { customConfig: { session: session } }
      );

      if (response.status === 200) {
        const data = await response.data;

        const newPlayerCards = normalizePlayerCards(data.allPlayerCards);
        setPlayerCards(newPlayerCards);

        const forged = data.updatedCard?.card ? data.updatedCard.card : data.updatedCard;
        if (forged?.name) {
          setAlertMessage(`Carte ${forged.name} obtenue !`);
        } else {
          setAlertMessage(`Nouvelle carte obtenue !`);
        }

        setAlertType("success");
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 5000);

        if (forged) setSelectedCard(forged);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setError("Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.");
        setTimeout(() => {
          signOut();
          router.push("/");
        }, 3000);
      } else {
        setError("Erreur lors de la forge. " + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // garde localStorage points
    if (typeof localStorage !== "undefined") {
      if (localStorage.getItem("points") != null) {
        localStorage.setItem("points", points);
      }
    }

    if (error === "Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.") {
      setTimeout(() => {
        localStorage.removeItem("userOC");
        localStorage.removeItem("points");
        signOut();
        router.push("/");
      }, 3000);
    }

    if (status === "unauthenticated") {
      router.push("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, error, router, points]);

  function HeadView() {
    return (
      <Head>
        <title>Forge - Owarida</title>
        <meta name="description" content="Forgez vos cartes" />
        <meta name="keywords" content="forge, cartes, owarida, karssi" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
    );
  }

  // UI states
  if (error) {
    return (
      <>
        <HeadView />
        <div className="flex flex-col min-h-screen">
          <Header points={points} />
          <main className="pt-20 flex-1 flex items-center justify-center px-4">
            <span className="text-center text-red-500 font-semibold">⚠ {error}</span>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  if (status === "loading" || loading) {
    return (
      <>
        <HeadView />
        <div className="flex flex-col min-h-screen">
          <Header points={points} />
          <main className="pt-20 flex-1 flex items-center justify-center">
            <span className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
                <path
                  fill="#1f2937"
                  d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"
                >
                  <animateTransform
                    attributeName="transform"
                    dur="0.75s"
                    repeatCount="indefinite"
                    type="rotate"
                    values="0 12 12;360 12 12"
                  />
                </path>
              </svg>
            </span>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  // Main view
  if (session) {
    const forgeable = (playerCards ?? [])
      .filter((c) => c?.category === selectedCategory)
      .filter((c) => (c?.count ?? 0) >= 3);

    return (
      <>
        <HeadView />
        <div className="flex flex-col min-h-screen">
          <Header points={points} />

          <main className="pt-20 pb-10 flex-1">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              {/* HERO */}
              <section className="rounded-2xl border border-black/5 bg-white/70 backdrop-blur shadow-lg p-5 sm:p-6">
                <div className="flex flex-col lg:flex-row gap-6 items-center">
                  <div className="relative w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] shrink-0">
                    <Image
                      src="/images/blacksmith.png"
                      alt="blacksmith"
                      layout="fill"
                      objectFit="contain"
                      priority={true}
                    />
                  </div>

                  <div className="w-full">
                    <h1 className="text-2xl sm:text-3xl font-extrabold">La Forge</h1>
                    <p className="mt-2 text-black/70">
                      Donne <b>3 cartes identiques</b> pour obtenir une nouvelle carte de la même{" "}
                      <b>collection</b> et <b>rareté</b>.
                    </p>

                    {/* Tabs */}
                    <div className="mt-4 flex gap-2 flex-wrap">
                      {["Elden Ring", "Dark Souls"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => handleCategoryChange(cat)}
                          className={`px-4 py-2 rounded-full text-sm font-semibold transition border
                            ${
                              selectedCategory === cat
                                ? "bg-black/90 text-white border-black/10 shadow"
                                : "bg-white text-black/70 border-black/10 hover:bg-black/5"
                            }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 text-sm text-black/60">
                      Cartes forgeables : <b>{forgeable.length}</b>
                    </div>
                  </div>
                </div>
              </section>

              {/* GRID */}
              <section className="mt-6">
                {forgeable.length === 0 ? (
                  <div className="rounded-2xl border border-black/5 bg-white/60 shadow p-6 text-center text-black/70">
                    Aucune carte forgeable dans <b>{selectedCategory}</b> (il faut au moins <b>x3</b>).
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {forgeable.map((c) => (
                      <div
                        key={c.id}
                        className="group rounded-2xl border border-black/5 bg-white/70 shadow hover:shadow-xl transition overflow-hidden"
                      >
                        <div className="relative aspect-square">
                          <Image
                            priority={true}
                            src={c.picture}
                            alt={c.name}
                            layout="fill"
                            objectFit="contain"
                            sizes="100%"
                          />

                          {/* Count badge */}
                          <div className="absolute bottom-2 right-2 bg-red-600 text-white rounded-full px-2 py-1 text-xs font-extrabold shadow">
                            x{c.count}
                          </div>

                          {/* Rarety pill */}
                          <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-[11px] font-bold bg-black/70 text-white">
                            {c.rarety}
                          </div>
                        </div>

                        <div className="p-3">
                          <div className="text-sm font-bold truncate">{c.name}</div>

                          <button
                            onClick={() => handleForgeCard(c)}
                            className="mt-3 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2 text-sm font-bold transition"
                          >
                            Sacrifier x3
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Modal (1 seule fois) */}
              {showModal && cardToForge && (
                <Modal
                  setShowModal={setShowModal}
                  title="Confirmation de fabrication"
                  message={
                    <>
                      Fabriquer une carte <b>{cardToForge.rarety}</b> en sacrifiant 3 exemplaires de{" "}
                      <b>{cardToForge.name}</b> ?
                    </>
                  }
                  handleConfirm={() => handleConfirmForgeCard(cardToForge.id)}
                />
              )}
            </div>
          </main>

          {/* Overlay carte obtenue */}
          {selectedCard && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-30 px-4 py-6 overflow-y-auto">
              <div className="relative w-full max-w-3xl">
                <div className="rounded-2xl bg-white/10 border border-white/10 shadow-2xl p-4">
                  <div className="relative w-full aspect-square">
                    <Image
                      priority={true}
                      src={selectedCard.picture}
                      alt={"Carte " + selectedCard.id}
                      layout="fill"
                      objectFit="contain"
                      sizes="100%"
                    />
                  </div>

                  <button
                    onClick={closeEnlargeView}
                    className="mt-4 w-full sm:w-auto bg-red-500 hover:bg-red-700 text-white py-2 px-4 rounded-xl font-bold"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}

          {showAlert && (
            <Alert type={alertType} message={alertMessage} close={setShowAlert} />
          )}

          <Footer />
        </div>
      </>
    );
  }

  // fallback
  return (
    <>
      <HeadView />
      <div className="flex flex-col min-h-screen">
        <Header points={points} />
        <main className="pt-20 flex-1">
          <div className="w-full h-[70vh] relative">
            <Image
              src="/images/closed.png"
              alt="Fond"
              layout="fill"
              objectFit="cover"
              objectPosition="center"
              priority={true}
            />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return {
      props: { errorServer: "Session expirée reconnectez-vous" },
    };
  }

  try {
    const response = await axios.get(`${process.env.NEXTAUTH_URL}/api/user/card`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.customJwt}`,
        cookie: context.req.headers.cookie,
      },
    });

    const cards = await response.data;

    const timestamp = new Date().getTime().toString();
    const signature = await axios.post(
      `${process.env.NEXTAUTH_URL}/api/generateSignature`,
      { timestamp },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.customJwt}`,
          cookie: context.req.headers.cookie,
        },
      }
    );

    const responseUser = await axios.get(`${process.env.NEXTAUTH_URL}/api/user`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.customJwt}`,
        cookie: context.req.headers.cookie,
        "x-timestamp": timestamp,
        "x-signature": signature.data.signature,
      },
    });

    const user = await responseUser.data;
    const totalPoints = calculatePoints(user);

    return {
      props: { cards, totalPoints },
    };
  } catch (error) {
    if (error.response && error.response.status === 401) {
      return {
        props: {
          errorServer: "Erreur avec votre Token ou il est expiré. Veuillez vous reconnecter.",
        },
      };
    }

    return {
      props: { errorServer: error.message },
    };
  }
}
