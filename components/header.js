import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import DarkModeToggleSVG from "C/darkModeToggleSVG";
import { useDarkMode } from "@/contexts/darkModeContext";
import axiosInstance from "@/utils/axiosInstance";
import isDateBeforeToday from "@/utils/verifyDate";
import calculatePoints from "@/utils/calculatePoints";
import Alert from "C/alert";

export default function Header({ points, player }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRuelleOpen, setIsRuelleOpen] = useState(false);

  const { data: session } = useSession();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState(null);
  const [userPoints, setUserPoints] = useState(points);

  const router = useRouter();
  const ruelleRef = useRef(null);

  let user;
  if (typeof localStorage !== "undefined") {
    user = JSON.parse(localStorage.getItem("userOC"));
  }

  useEffect(() => setUserPoints(points), [points]);

  const handleSignOut = () => {
    localStorage.removeItem("userOC");
    localStorage.removeItem("points");
    signOut();
  };

  const getReward = async () => {
    try {
      const res = await axiosInstance.get("/api/user/reward", {
        customConfig: { session: session },
      });

      if (res.status === 200) {
        const data = await res.data;
        localStorage.setItem("userOC", JSON.stringify(data.user));
        const totalPoints = calculatePoints(data.user);
        localStorage.setItem("points", totalPoints);
        setUserPoints(totalPoints);

        setAlertMessage(data.message);
        setAlertType("success");
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 5000);
      }
    } catch (error) {
      if (error?.response) {
        const { status, data } = error.response;

        if (status === 404 && data.message?.includes("does not subscribe")) {
          setAlertMessage("Vous devez être abonné pour obtenir une récompense.");
        } else if (status === 400) {
          setAlertMessage(data.message || "Une erreur est survenue.");
        } else {
          setAlertMessage("Une erreur inattendue est survenue.");
        }
      } else {
        setAlertMessage("Impossible de communiquer avec le serveur. Veuillez réessayer.");
      }

      setAlertType("error");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
    }
  };

  // Scroll blur
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close ruelle on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (!ruelleRef.current) return;
      if (!ruelleRef.current.contains(e.target)) setIsRuelleOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const navLinkClass = (href) => {
    const active = router.pathname === href;
    return `px-3 py-2 rounded-xl transition ${
      active ? "bg-white/15 text-white" : "text-white/85 hover:bg-white/10 hover:text-white"
    }`;
  };

  if (!session) {
    return (
      <header className="w-full p-4" style={{ backgroundColor: "#2B2D42" }}>
        <div className="mx-auto max-w-7xl flex justify-center items-center">
          <Image src={"/images/owaCollect.png"} alt="banner owaCollect" priority width={250} height={200} />
        </div>
      </header>
    );
  }

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-10 transition duration-300 ease-in-out font-bold text-white w-full shadow-[0_10px_30px_rgba(0,0,0,0.25)] ${isScrolled ? 'backdrop-blur' : ''}`}
  style={{ backgroundColor: isScrolled ? '#2B2D4280' : '#2B2D42' }}
>
        {/* Container centered */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3">
          <div className="h-16 flex items-center justify-between gap-4">
            {/* Left: identity + points */}
            <Link href="/" className="flex items-center gap-3 min-w-[220px]">
              <span className="hidden sm:inline text-white/85 border-white/30 border-r pr-3">
                {session.user.name}
              </span>
              <span className="font-semibold">{userPoints ? userPoints : 0} OC</span>
            </Link>

            {/* Middle: War bars (only on /war) */}
            {player && router.pathname === "/war" && (
              <div className="hidden lg:flex items-center gap-6">
                <div className="min-w-[220px]">
                  <div className="text-xs text-white/80 mb-1">Vie : {player?.hp}/{player?.hpMax}</div>
                  <div className="relative w-full h-2 bg-white/20 rounded">
                    <div
                      className="absolute top-0 left-0 h-2 bg-red-500 rounded"
                      style={{ width: `${(player?.hp / player?.hpMax) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="min-w-[220px]">
                  <div className="text-xs text-white/80 mb-1">PA : {player?.pa}/{player?.paMax}</div>
                  <div className="relative w-full h-2 bg-white/20 rounded">
                    <div
                      className="absolute top-0 left-0 h-2 bg-blue-500 rounded"
                      style={{ width: `${(player?.pa / player?.paMax) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Right: nav + actions */}
            <div className="flex items-center gap-2">
              {/* Reward */}
              {user && user.reward && isDateBeforeToday(user.reward) ? (
                <button
                className="shrink-0 inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/15 transition p-2"
                title="Récompense quotidienne"
                onClick={() => getReward()}
              >
                <Image src="/images/gift.gif" alt="reward" width={40} height={40} />
              </button>
              ) : null}

              {/* Desktop Nav */}
              <nav className="hidden lg:flex items-center gap-1">
                <Link href="/collection" className={navLinkClass("/collection")}>Collection</Link>
                <Link href="/shop" className={navLinkClass("/shop")}>Boutique</Link>
                <Link href="/owarida" className={navLinkClass("/owarida")}>Owarida</Link>

                {/* Ruelle dropdown */}
                <div className="relative" ref={ruelleRef}>
                  <button
                    onClick={() => setIsRuelleOpen((v) => !v)}
                    className={`px-3 py-2 rounded-xl transition ${
                      isRuelleOpen ? "bg-white/15" : "hover:bg-white/10"
                    }`}
                  >
                    Ruelle
                  </button>

                  {isRuelleOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#2B2D42] border border-white/10 shadow-2xl overflow-hidden">
                      <Link href="/alley9-3/4" className="block px-4 py-3 hover:bg-white/10">Ruelle</Link>
                      <Link href="/blacksmith" className="block px-4 py-3 hover:bg-white/10">Forgeron</Link>
                      <Link href="/secretShop/tr74g4in" className="block px-4 py-3 hover:bg-white/10">Marchand</Link>
                      <Link href="/scribe" className="block px-4 py-3 hover:bg-white/10">Scribe</Link>
                      <Link href="/scribe/enigma" className="block px-4 py-3 hover:bg-white/10">Enigma</Link>
                    </div>
                  )}
                </div>
              </nav>

              {/* Dark mode */}
              <button
                onClick={toggleDarkMode}
                className="hidden lg:inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/15 transition p-2"
                title="Mode sombre"
              >
                <DarkModeToggleSVG isDarkMode={darkMode} />
              </button>

              {/* Logout */}
              <button
                className="hidden lg:inline-flex bg-red-500 hover:bg-red-700 font-bold py-2 px-4 rounded-xl"
                onClick={handleSignOut}
              >
                Déconnexion
              </button>

              {/* Mobile menu button */}
              <button onClick={() => setIsMenuOpen((v) => !v)} className="lg:hidden rounded-xl bg-white/10 hover:bg-white/15 transition p-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24">
                  <g fill="white">
                    <path d="M8 6.983a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2zM7 12a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H8a1 1 0 0 1-1-1m1 3.017a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2z" />
                    <path fillRule="evenodd" d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2s10 4.477 10 10m-2 0a8 8 0 1 1-16 0a8 8 0 0 1 16 0" clipRule="evenodd" />
                  </g>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-white/10" style={{ backgroundColor: isScrolled ? "#2B2D4280" : "#2B2D42" }}>
            <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col gap-2">
              <Link href="/collection" className="px-4 py-3 rounded-xl hover:bg-white/10">Collection</Link>
              <Link href="/shop" className="px-4 py-3 rounded-xl hover:bg-white/10">Boutique</Link>
              <Link href="/owarida" className="px-4 py-3 rounded-xl hover:bg-white/10">Owarida</Link>
              <Link href="/alley9-3/4" className="px-4 py-3 rounded-xl hover:bg-white/10">Ruelle</Link>
              <Link href="/secretShop/tr74g4in" className="px-4 py-3 rounded-xl hover:bg-white/10">Marchand</Link>
              <Link href="/scribe" className="px-4 py-3 rounded-xl hover:bg-white/10">Scribe</Link>
              <Link href="/scribe/enigma" className="px-4 py-3 rounded-xl hover:bg-white/10">Enigma</Link>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button onClick={toggleDarkMode} className="flex-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 flex justify-center">
                  <DarkModeToggleSVG isDarkMode={darkMode} />
                </button>
                <button onClick={handleSignOut} className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-700 font-bold">
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* War bars under header (mobile/tablet) */}
      {session && router.pathname === "/war" && (
        <div className="fixed top-[64px] left-0 right-0 z-10 px-4 py-2 lg:hidden pointer-events-none">
          <div className="mx-auto max-w-7xl grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-white/85 mb-1">Vie : {player?.hp}/{player?.hpMax}</div>
              <div className="relative w-full h-2 bg-white/20 rounded">
                <div className="absolute top-0 left-0 h-2 bg-red-500 rounded" style={{ width: `${(player?.hp / player?.hpMax) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="text-xs text-white/85 mb-1">PA : {player?.pa}/{player?.paMax}</div>
              <div className="relative w-full h-2 bg-white/20 rounded">
                <div className="absolute top-0 left-0 h-2 bg-blue-500 rounded" style={{ width: `${(player?.pa / player?.paMax) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {showAlert && <Alert type={alertType} message={alertMessage} close={setShowAlert} />}
    </>
  );
}
