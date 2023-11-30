import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";

export default function Header() {
  const { data: session, status } = useSession();
  return (
    <>
      {session ? (
        // if session
        <header className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center">
              <span className="mr-4">{session.user.name}</span>
            </div>
            <nav className="hidden md:flex space-x-16">
              <Link href="#" className="hover:text-gray-300">Ma collection</Link>
              <Link href="/shop" className="hover:text-gray-300">Shop</Link>
            </nav>
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => signOut()}
          >
            Déconnexion
          </button>
          </div>
        </header>
      ) : (
        // if user haven't session
        <header className="bg-gray-800 text-white w-full">
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