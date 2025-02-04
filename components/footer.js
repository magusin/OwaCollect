import Link from "next/link";
import { useDarkMode } from "@/contexts/darkModeContext";
import { useSession } from "next-auth/react";
export default function Footer() {
    const { darkMode } = useDarkMode();
    const { data: session, status } = useSession();

    return (
        <>
        {session ? (
        <footer className={`z-10 text-center md:flex justify-around items-center min-w-full w-full text-white`} style={{ backgroundColor:'#2B2D42', minHeight: '50px' }}>
            <p>© 2024 - OwaCollect</p>
            <nav className="md:flex space-x-4 md:space-x-8 xl:space-x-16">
                <Link href="/cgu" className="hover:text-gray-300">CGU</Link>
                <Link href="/contact" className="hover:text-gray-300">Contact</Link>
            </nav>
        </footer>
        ) : (
        null
        )}
        </>
    );
}