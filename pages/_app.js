import '@/styles/globals.css'
import { SessionProvider } from "next-auth/react";
import GoogleAnalytics from "C/googleAnalytics";
import { DarkModeProvider } from '@/contexts/darkModeContext';

export default function App({ Component, pageProps }) {
  
  
  return (
    <SessionProvider session={pageProps.session}>
      <GoogleAnalytics trackingId="G-VQ455GC1GK" />
      <DarkModeProvider>
      <Component {...pageProps} />
      </DarkModeProvider>
    </SessionProvider>
  );
}
