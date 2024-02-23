import React, { useEffect, useState } from 'react';
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import DarkModeToggleSVG from 'C/darkModeToggleSVG';
import { useDarkMode } from '@/contexts/darkModeContext';
import { useRouter } from 'next/router';

export default function Header({ points }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const router = useRouter();

  const handleSignOut = () => {
    // Vider le localStorage
    localStorage.removeItem('userOC');
    localStorage.removeItem('points');
    // Se déconnecter avec NextAuth
    signOut();
  };


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
        // if session
        <header className={`${router.route === '/duel/[id]' ? '' : 'fixed'} top-0 left-0 right-0 z-10 transition duration-300 ease-in-out font-bold ${isScrolled ? 'backdrop-blur' : ''} ${darkMode ? 'text-black' : 'text-white'} p-4 w-full`} style={{ backgroundColor: isScrolled ? '#00990080' : '#009900' }}>
          <div className=" flex justify-between items-center">
            <Link href='/' className="flex items-center">
              <span className={`${darkMode ? 'border-black' : 'border-white'} mr-4 border-r-2 pr-2`}>{session.user.name}</span>
              <span className="mr-4">{points ? points : 0} OC</span>
            </Link>
            <nav className="hidden md:flex space-x-6 xl:space-x-16 px-4">
              <Link href="/collection" className="hover:text-gray-300">Collection</Link>
              <Link href="/deck" className="hover:text-gray-300">Deck</Link>
              <Link href="/shop" className="hover:text-gray-300">Boutique</Link>
              <Link href="/owarida" className="hover:text-gray-300">Owarida</Link>
              <Link href="/alley9-3/4" className="hover:text-gray-300">Ruelle</Link>
            </nav>
            <div className='flex'>
            <button onClick={toggleDarkMode} className="hidden md:block text-white py-2 px-4 rounded mr-4">
              <DarkModeToggleSVG isDarkMode={darkMode} />
            </button>
            <button onClick={toggleMenu} className="md:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill={darkMode ? 'black' : 'white'}><path d="M8 6.983a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2zM7 12a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H8a1 1 0 0 1-1-1m1 3.017a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2z" /><path fillRule="evenodd" d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2s10 4.477 10 10m-2 0a8 8 0 1 1-16 0a8 8 0 0 1 16 0" clipRule="evenodd" /></g></svg>
            </button>
            <button
              className={`hidden md:block bg-red-500 hover:bg-red-700 font-bold py-2 px-4 rounded`}
              onClick={handleSignOut}
            >
              Déconnexion
            </button>
            </div>
          </div>
          {/* Menu déroulant pour petits écrans */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 p-4" style={{ backgroundColor: '#009900' }}>
              <Link href="/collection" className="text-center hover:text-gray-300 block">Collection</Link>
              <Link href="/deck" className="text-center hover:text-gray-300 block">Deck</Link>
              <Link href="/shop" className="text-center hover:text-gray-300 block">Boutique</Link>
              <Link href="/owarida" className="text-center hover:text-gray-300 block">Owarida</Link>
              <Link href="/alley9-3/4" className="text-center hover:text-gray-300 block">Ruelle</Link>
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
        // if user haven't session
        <header className="w-full p-4" style={{ backgroundColor: '#009900' }}>
          <div className="container mx-auto flex justify-center items-center  h-auto">
            <Image
              src={"/images/owaCollect.png"}
              alt="banner owaCollect"
              priority={true}
              width={200}
              height={200}
            />
          </div>
        </header>
      )}
    </>
  )
}