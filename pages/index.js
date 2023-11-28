import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/router";
import OwaGif from "C/owaGif";
import Header from "C/header";

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push('/'); // Rediriger vers la même page pour mettre à jour le status
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div className="flex-col content-center items-center h-screen">Chargement...</div>; // ajouter un spinner
  }

  if (session) {
    console.log('session: ', session);
    return (
      <div className="flex-col content-center items-center h-screen">
        <Header />
        <OwaGif />
        <p>Connecté en tant que {session.user.name}</p>

        
      </div>
    )
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <button
        className="bg-blue-500 text-white font-bold py-2 px-4 rounded"
        onClick={() => signIn('twitch')}
      >
        Se connecter avec Twitch
      </button>
    </div>
  );
}