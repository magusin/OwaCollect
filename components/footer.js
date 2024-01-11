import Link from "next/link";
import { useDarkMode } from "@/contexts/darkModeContext";

export default function Footer() {
    const { darkMode } = useDarkMode();

    return (
        <footer className={`text-center md:flex justify-around items-center min-w-full w-full ${darkMode ? 'text-black' : 'text-white'}`} style={{ backgroundColor:'#009900', minHeight: '50px' }}>
            <p>© 2024 - OwaCollect</p>
            <nav className="md:flex space-x-4 md:space-x-8 xl:space-x-16">
                {/* <Link href="/mentions-legales" className="md:block">Mentions légales</Link> */}
                <Link href="/cgu">CGU</Link>
                <Link href="/contact">Contact</Link>
            </nav>
        </footer>
    );
    }