import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/router";
import OwaGif from "C/owaGif";
import Header from "C/header";
import Link from "next/link";

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return <div className="flex-col content-center items-center h-screen">Chargement...</div>; // ajouter un spinner
  }

  if (session) {
    console.log('session: ', session);
    return (
      <div className="flex-col content-center items-center h-screen">
        <Header />
        <p>Connecté en tant que {session.user.name}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col content-center items-center h-screen">
      <Header />
    <div className="flex flex-col h-full w-full justify-center items-center ">
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