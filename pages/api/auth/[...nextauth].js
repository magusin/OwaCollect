import NextAuth from "next-auth";
import TwitchProvider from "next-auth/providers/twitch";

export default NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid user:read:email channel:read:subscriptions'
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
        // Persist the OAuth access_token and or the user id to the token right after signin     
        if (account) {
          token.accessToken = account.access_token
          token.id = account.providerAccountId;
        }
        return token
      },
    async session({ session, token, user }) {
      // Send properties to the client, like an access_token and user id from a provider.
      session.accessToken = token.accessToken
      session.user.id = token.sub
      
      return session
    }
  }
});