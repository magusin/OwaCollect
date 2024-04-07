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
          scope: 'openid user:read:email user:read:subscriptions'
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
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
          try {
          // Obtenir les informations d'abonnement de l'utilisateur
          const urlSub = `https://api.twitch.tv/helix/subscriptions/user?broadcaster_id=${process.env.BROADCASTER_ID}&user_id=${token.id}`;
          const subscriptionsResponse = await fetch(urlSub, {
            method: 'GET',
            headers: {
              'Client-ID': process.env.TWITCH_CLIENT_ID,
              'Authorization': `Bearer ${account.access_token}`
            }
          });

          if (subscriptionsResponse.ok) {
            const responseData = await subscriptionsResponse.json();
            console.log(responseData)
            const isSubscribed = responseData.data.length > 0;
            if (isSubscribed) {
            token.isSubscribed = isSubscribed;
            } else {
              token.isSubscribed = false;
            }
          } else {
            throw new Error('Failed to fetch subscriptions');
          }
        } catch (error) {
          console.error(error);
          return {
            ...token,
            error: "SubsError",
          };
        }
      }

        if (Date.now() < token.accessTokenExpires) {
          return token
        }
        // Access token has expired, try to update it
        return refreshAccessToken(token)
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