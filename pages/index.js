import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push('/'); // Rediriger vers la même page pour mettre à jour le status
      console.log(session);
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div>Chargement...</div>; // ajouter un spinner
  }

  if (session) {
    return (
      <div className="flex justify-center items-center h-screen">
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