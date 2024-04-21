import '@/styles/globals.css'
import { SessionProvider } from "next-auth/react";
import GoogleAnalytics from "C/googleAnalytics";
import { DarkModeProvider } from '@/contexts/darkModeContext';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from "@vercel/analytics/react"

export default function App({ Component, pageProps }) {
  
  
  return (
    <SessionProvider session={pageProps.session}>
      <Analytics/>
      <SpeedInsights />
      <GoogleAnalytics trackingId="G-VQ455GC1GK" />
      <DarkModeProvider>
      <Component {...pageProps} />
      </DarkModeProvider>
    </SessionProvider>
  );
}
