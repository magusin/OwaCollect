// nextAuthOptions.js
import TwitchProvider from "next-auth/providers/twitch";

const nextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
      authorization: {
        // necessary scope permissions
        params: {
          scope: 'openid user:read:email'
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and or the user id to the token right after signin     
      if (account) {
        // token.accessToken = account.access_token
        token.id = account.providerAccountId;
        const userPayload = {
          id: token.id,
          name: token.name,
          email: token.email,
          image: token.picture
        };
        const expiresIn = account.expires_at - Math.floor(Date.now() / 1000);
        const customJwt = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn });
        token.customJwt = customJwt;
      }
      return token
    },
  async session({ session, token, user }) {
    // Send properties to the client
    // session.accessToken = token.accessToken
    session.user.id = token.sub
    session.customJwt = token.customJwt;
    return session
  }
  }
};

export default nextAuthOptions;