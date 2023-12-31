import React, { useEffect, useState } from 'react';
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";

export default function Header({points}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { data: session, status } = useSession();

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
  
  return (
    <>
      {session ? (
        // if session
        <header className={`fixed top-0 left-0 right-0 z-10 transition duration-300 ease-in-out ${isScrolled ? 'bg-gray-800/80 backdrop-blur' : 'bg-gray-800'} text-white p-4 w-full`}>
          <div className="container mx-auto flex justify-between items-center">
            <Link href='/' className="flex items-center">
              <span className="mr-4 border-r-2 pr-2">{session.user.name}</span>
              <span className="mr-4">{points ? points : 0} OC</span>
            </Link>
            <nav className="space-x-16 px-4">
              <Link href="/collection" className="hover:text-gray-300">Collection</Link>
              <Link href="/shop" className="hover:text-gray-300">Boutique</Link>
            </nav>
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={handleSignOut}
          >
            Déconnexion
          </button>
          </div>
        </header>
      ) : (
        // if user haven't session
        <header className="bg-gray-800 text-white w-full p-4">
          <div className="container mx-auto flex justify-center items-center  h-full">
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
    </>
  )
}