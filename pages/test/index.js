import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-200 min-h-screen overflow-y-hidden">
      <nav className="bg-white shadow-lg p-6">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-blue-700">
            <Link href="/">NovaConnect</Link>
          </h1>
          <div className="hidden md:flex space-x-8">
            <Link href="#about"
              className="text-lg font-medium text-gray-800 hover:text-blue-600 transition-colors duration-300">Projet
            </Link>
            <Link href="#about"
              className="text-lg font-medium text-gray-800 hover:text-blue-600 transition-colors duration-300">Equipe
            </Link>
            <Link href="#contact"
              className="text-lg font-medium text-gray-800 hover:text-blue-600 transition-colors duration-300">Contactez-nous
            </Link>
          </div>
          <button
            className="md:hidden text-blue-700 focus:outline-none"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16m-7 6h7"
              ></path>
            </svg>
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-white shadow-md p-4 space-y-4">
            <Link href="#about"
              className="block text-lg font-medium text-gray-800 hover:text-blue-600 transition-colors duration-300">Projet
            </Link>
            <Link href="#about"
              className="block text-lg font-medium text-gray-800 hover:text-blue-600 transition-colors duration-300">Equipe
            </Link>
            <Link href="#contact"
              className="block text-lg font-medium text-gray-800 hover:text-blue-600 transition-colors duration-300">Contactez-nous
            </Link>
          </div>
        )}
      </nav>
      <div className="relative h-[300px] w-full">
        <Image
          src="/images/nova.png"
          alt="Hero Image"
          layout="fill"
          objectFit="cover"
          className="shadow-2xl"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-white text-xl max-w-2xl text-center bg-blue-900 bg-opacity-75 p-4 rounded-md border-4 border-white mx-4">
            NovaConnect est une entreprise innovante dédiée à connecter les petites entreprises avec les solutions technologiques de demain. Nous créons des outils intelligents et intuitifs qui favorisent la croissance et simplifient la vie professionnelle.
          </p>
        </div>
      </div>
      <div className="w-full h-16 bg-gradient-to-b from-blue-200 to-transparent transform rotate-3"></div>
      <main className="container mx-auto px-4">
        <section id="about" className="mb-8 md:mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <h3 className="text-2xl font-bold text-blue-700 mb-4">Développement Web</h3>
              <p className="text-gray-700">
                Nous créons des sites web modernes et performants adaptés aux besoins spécifiques de chaque entreprise, en utilisant des technologies récentes et robustes.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <h3 className="text-2xl font-bold text-blue-700 mb-4">Consulting Technologique</h3>
              <p className="text-gray-700">
                Nos experts vous accompagnent dans la mise en place de solutions technologiques optimisées pour améliorer l'efficacité et la productivité de votre entreprise.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <h3 className="text-2xl font-bold text-blue-700 mb-4">Support & Maintenance</h3>
              <p className="text-gray-700">
                Nous assurons un support continu et une maintenance proactive pour garantir la stabilité et la sécurité de vos systèmes et plateformes.
              </p>
            </div>
          </div>
        </section>
        <section id="services" className="bg-blue-900 p-12 rounded-lg shadow-2xl text-white relative overflow-hidden" >
          <svg
            className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 800 600"
            fill="none"
          >
            <circle cx="400" cy="300" r="500" fill="url(#gradient1)" />
            <defs>
              <linearGradient id="gradient1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00f0ff" />
                <stop offset="100%" stopColor="#0033ff" />
              </linearGradient>
            </defs>
          </svg>
          <h2 className="text-4xl font-bold mb-8 text-center relative">Pourquoi choisir NovaConnect ?</h2>
          <p className="text-lg leading-relaxed text-center max-w-3xl mx-auto relative">
            Chez NovaConnect, nous nous engageons à offrir des solutions technologiques qui permettent aux petites entreprises de se transformer, de se développer et de prospérer. 
            Avec une équipe d'experts passionnés, nous combinons innovation, simplicité, et expertise pour créer des outils sur mesure qui répondent à vos besoins.
            Notre objectif est de faire en sorte que chaque client se sente soutenu et qu'il dispose des moyens nécessaires pour réussir dans un monde de plus en plus numérique.
          </p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 relative">
            <div className="bg-blue-800 bg-opacity-80 p-6 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-500">
              <h3 className="text-2xl font-bold mb-4 text-blue-300">Intelligence Artificielle</h3>
              <p>
                Exploitez la puissance de l'IA pour automatiser vos processus métiers, améliorer vos services clients et prendre des décisions plus éclairées.
              </p>
            </div>
            <div className="bg-blue-800 bg-opacity-80 p-6 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-500">
              <h3 className="text-2xl font-bold mb-4 text-blue-300">Blockchain & Sécurité</h3>
              <p>
                Garantissez la sécurité et l'intégrité de vos données grâce à des solutions blockchain innovantes adaptées à vos besoins d'entreprise.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}