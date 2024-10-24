import React, { useEffect, useState } from 'react';
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import DarkModeToggleSVG from 'C/darkModeToggleSVG';
import { useDarkMode } from '@/contexts/darkModeContext';
import axiosInstance from '@/utils/axiosInstance';
import isDateBeforeToday from '@/utils/verifyDate';
import calculatePoints from '@/utils/calculatePoints';
import Alert from 'C/alert';

export default function Header({ points, player }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState(null);
  const [userPoints, setUserPoints] = useState(points);
  const router = useRouter();

  let user;
  if (typeof localStorage !== 'undefined') {
    user = JSON.parse(localStorage.getItem('userOC'));
  }

  const handleSignOut = () => {
    // Vider le localStorage
    localStorage.removeItem('userOC');
    localStorage.removeItem('points');
    // Se déconnecter avec NextAuth
    signOut();
  };

  useEffect(() => {
    setUserPoints(points); // Mettre à jour les points lors du changement de la prop points
  }, [points]);

  const getReward = async () => {
    try {
      const res = await axiosInstance.get('/api/user/reward', {
        customConfig: { session: session }
      });
      if (res.status === 200) {
        const data = await res.data;
        localStorage.setItem('userOC', JSON.stringify(data.user));
        const totalPoints = calculatePoints(data.user);
        localStorage.setItem('points', totalPoints);
        setUserPoints(totalPoints);
        setAlertMessage(data.message);
        setAlertType('success');
        setShowAlert(true);
        setTimeout(() => {
          setShowAlert(false);
        }, 5000);
      } else if (res.status === 400) {
        setAlertMessage(res.data.message);
        setAlertType('error');
        setShowAlert(true);
        setTimeout(() => {
          setShowAlert(false);
        }, 5000);
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    // Écouter l'événement de défilement
    window.addEventListener('scroll', handleScroll);

    // Nettoyer l'écouteur d'événements
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Gestion du menu burger
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      {session ? (
        <header className={`fixed top-0 left-0 right-0 z-10 transition duration-300 ease-in-out font-bold ${isScrolled ? 'backdrop-blur' : ''} text-white p-4 w-full`} style={{ backgroundColor: isScrolled ? '#2B2D4280' : '#2B2D42' }}>
          <div className="flex justify-between items-center">
            <Link href='/' className="flex items-center">
              <span className={`${darkMode ? 'border-black' : 'border-white'} mr-4 border-r-2 pr-2`}>{session.user.name}</span>
              <span className="mr-4">{userPoints ? userPoints : 0} OC</span>
            </Link>
            {player && router.pathname === '/war' && (
              // Affichage des points de vie et des points d'action
              <div className="items-center hidden sm:max-lg:flex md:items-start ">
              <div className="flex-col items-center mr-4">
                <span>Vie : {player?.hp}/{player?.hpMax}</span>
                <div className="relative w-full h-4 bg-gray-300 rounded">
                  <div className="absolute top-0 left-0 h-4 bg-red-500 rounded" style={{ width: `${(player?.hp / player?.hpMax) * 100}%` }}></div>
                </div>
              </div>
                <div className="flex-col items-center">
                <span>PA : {player?.pa}/{player?.paMax}</span>
                <div className="relative w-full h-4 bg-gray-300 rounded">
                  <div className="absolute top-0 left-0 h-4 bg-blue-500 rounded" style={{ width: `${(player?.pa / player?.paMax) * 100}%` }}></div>
                  </div> 
              </div>
              </div>
            )}
            {user && user.reward && isDateBeforeToday(user.reward) ? (
              <Image src="/images/gift.gif" alt="logo owaCollect" className='cursor-pointer' width={48} height={48} onClick={() => getReward()} />
            ) : null}
            <nav className="hidden lg:flex space-x-3 lg:space-x-8 px-4">
              <Link href="/collection" className="hover:text-gray-300">Collection</Link>
              <Link href="/shop" className="hover:text-gray-300">Boutique</Link>
              <Link href="/owarida" className="hover:text-gray-300">Owarida</Link>
              <Link href="/alley9-3/4" className="hover:text-gray-300">Ruelle</Link>
              <Link href="/war" className="hover:text-gray-300">Guerre</Link>
            </nav>
            <div className='flex items-center'>
              <button onClick={toggleDarkMode} className="hidden lg:block text-white py-2 px-4 rounded mr-4">
                <DarkModeToggleSVG isDarkMode={darkMode} />
              </button>
              <button onClick={toggleMenu} className="lg:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24">
                  <g fill={darkMode ? 'black' : 'white'}>
                    <path d="M8 6.983a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2zM7 12a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H8a1 1 0 0 1-1-1m1 3.017a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2z" />
                    <path fillRule="evenodd" d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2s10 4.477 10 10m-2 0a8 8 0 1 1-16 0a8 8 0 0 1 16 0" clipRule="evenodd" />
                  </g>
                </svg>
              </button>
              <button
                className={`hidden lg:block bg-red-500 hover:bg-red-700 font-bold py-2 px-4 rounded`}
                onClick={handleSignOut}
              >
                Déconnexion
              </button>
            </div>
          </div>
          {/* Menu déroulant pour petits écrans */}
          {isMenuOpen && (
            <div className="lg:hidden absolute top-full left-0 right-0 p-4 bg-gray-800">
              <Link href="/collection" className="text-center hover:text-gray-300 block">Collection</Link>
              <Link href="/shop" className="text-center hover:text-gray-300 block">Boutique</Link>
              <Link href="/owarida" className="text-center hover:text-gray-300 block">Owarida</Link>
              <Link href="/alley9-3/4" className="text-center hover:text-gray-300 block">Ruelle</Link>
              <Link href="/war" className="text-center hover:text-gray-300 block">Guerre</Link>
              <button onClick={toggleDarkMode} className="w-full py-2 px-4 rounded flex justify-center items-center">
                <DarkModeToggleSVG isDarkMode={darkMode} />
              </button>
              <button className="bg-red-500 hover:bg-red-700 font-bold py-2 px-4 rounded block w-full mt-2" onClick={handleSignOut}>
                Déconnexion
              </button>
            </div>
          )}
        </header>
      ) : (
        // if user hasn't session
        <header className="w-full p-4" style={{ backgroundColor: '#2B2D4280' }}>
          <div className="container mx-auto flex justify-center items-center h-auto">
            <Image
              src={"/images/owaCollect.png"}
              alt="banner owaCollect"
              priority={true}
              width={300}
              height={300}
            />
          </div>
        </header>
      )}
      {session && router.pathname === '/war' && (
        <div className="fixed top-16 left-0 right-0 z-10 p-4 pointer-events-none sm:max-lg:hidden">
          <div className="flex flex-row items-center justify-between space-y-4 space-y-0">
            <div className="flex flex-col items-center items-start ">
              <span>Vie : {player?.hp}/{player?.hpMax}</span>
              <div className="relative w-full h-4 bg-gray-300 rounded">
                <div className="absolute top-0 left-0 h-4 bg-red-500 rounded" style={{ width: `${(player?.hp / player?.hpMax) * 100}%` }}></div>
              </div>
            </div>
            <div className="flex flex-col items-center items-start">
              <span>PA : {player?.pa}/{player?.paMax}</span>
              <div className="relative w-full h-4 bg-gray-300 rounded">
                <div className="absolute top-0 left-0 h-4 bg-blue-500 rounded" style={{ width: `${(player?.pa / player?.paMax) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showAlert && (
        <Alert
          type={alertType}
          message={alertMessage}
          close={setShowAlert}
        />
      )}
    </>
  )
}
