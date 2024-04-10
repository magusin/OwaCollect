import NextAuth from "next-auth";
import TwitchProvider from "next-auth/providers/twitch";
import jwt from 'jsonwebtoken';
import axios from "axios";

export default NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid user:read:email'
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      console.log('jwt', token, account, profile, user)
        // Persist the OAuth access_token and or the user id to the token right after signin     
        if (account && user) {
          token.id = account.providerAccountId;
          const userPayload = {
            id: token.id,
            name: token.name,
            email: token.email,
            image: token.picture
          };
          // const expiresIn = Math.floor(account.expires_at / 1000)
          const expiresIn = Date.now() + 3600000;
          const customJwt = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn });
          token.customJwt = customJwt;
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
          token.accessTokenExpires = expiresIn;
        }

        if (Date.now() < token.accessTokenExpires) {
          return token
        }
        // Access token has expired, try to update it
        return refreshAccessToken(token)
      },
    async session({ session, token, user }) {
      console.log('session', session, token, user)
      // Send properties to the client
      // session.accessToken = token.accessToken
      session.user.id = token.sub
      session.customJwt = token.customJwt;
      return session
    }
  }
});