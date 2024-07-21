import '@/styles/globals.css'
import { SessionProvider } from "next-auth/react";
import GoogleAnalytics from "C/googleAnalytics";
import { DarkModeProvider } from '@/contexts/darkModeContext';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from "@vercel/analytics/react"
import React from 'react';
import Router from "next/router";

export default function App({ Component, pageProps }) {
  const [loading, setLoading] = React.useState(false);
  
  React.useEffect(() => {
    const start = () => {
      setLoading(true);
    };
    const end = () => {
      setLoading(false);
    };
    Router.events.on("routeChangeStart", start);
    Router.events.on("routeChangeComplete", end);
    Router.events.on("routeChangeError", end);
    return () => {
      Router.events.off("routeChangeStart", start);
      Router.events.off("routeChangeComplete", end);
      Router.events.off("routeChangeError", end);
    };
  }, []);

  return (
    <SessionProvider session={pageProps.session}>
      <Analytics/>
      <SpeedInsights />
      <GoogleAnalytics trackingId="G-VQ455GC1GK" />
      <DarkModeProvider>
      {loading ? (
        <>
        <div className="flex flex-col h-screen">
          <div className="flex-grow flex justify-center items-center">
            <span className="text-center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><path fill="#1f2937" d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"><animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12" /></path></svg></span>
          </div>
        </div>
        </>
      ) :
      <Component {...pageProps} />
      }
      </DarkModeProvider>
    </SessionProvider>
  );
}
