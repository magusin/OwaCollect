import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head 
      />
      <body>
        <Main />
        <NextScript src="https://embed.twitch.tv/embed/v1.js"/>
      </body>
    </Html>
  )
}
