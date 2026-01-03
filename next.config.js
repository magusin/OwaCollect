const { withNextVideo } = require('next-video/process')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'imgur.com',
      },
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
      },
      {
        protocol: 'https',
        hostname: 'static-cdn.jtvnw.net',
      },
      { protocol: "https", hostname: "cdn.jsdelivr.net", pathname: "/**" },
    ],
  },
  async redirects() {
    return [
      {
        source: '/cicada',
        destination: '/fok',
        permanent: true,
      },
      {
        source: '/sin',
        destination: '/fok',
        permanent: true,
      },
      {
        source: '/sesame',
        destination: '/fok',
        permanent: true,
      },
      {
        source: '/sésame',
        destination: '/fok',
        permanent: true,
      },
      {
        source: '/streameur',
        destination: '/fok',
        permanent: true,
      },
      {
        source: '/streamer',
        destination: '/fok',
        permanent: true,
      },
      {
        source: '/backrooms',
        destination: '/fok',
        permanent: true,
      },
      {
        source: '/enigma',
        destination: '/fok',
        permanent: true,
      },
      {
        source: '/énigma',
        destination: '/fok',
        permanent: true,
      },
      {
        source: '/bigfoot',
        destination: '/fok',
        permanent: true,
      },
      {
        source: '/taured',
        destination: '/fok',
        permanent: true,
      },
      {
        source: '/helium',
        destination: '/fok',
        permanent: true,
      },
      {
        source: '/hélium',
        destination: '/fok',
        permanent: true,
      },
      {
        source: '/phénix',
        destination: '/fok',
        permanent: true,
      },
      {
        source: '/phenix',
        destination: '/fok',
        permanent: true,
      },
      {
        source: '/phoenix',
        destination: '/fok',
        permanent: true,
      },
      {
        source: '/lyoko',
        destination: '/fok',
        permanent: true,
      },
      {
        source: '/tracassin',
        destination: '/fok',
        permanent: true,
      }
    ]
  },
}

module.exports = withNextVideo(nextConfig)
