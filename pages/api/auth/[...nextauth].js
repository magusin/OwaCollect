import NextAuth from "next-auth";
import TwitchProvider from "next-auth/providers/twitch";
import jwt from 'jsonwebtoken';

export default NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
      authorization: {
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
            token.isSubscribed = responseData.data.length > 0 ? responseData.data[0].tier : false;
          } else {
            token.isSubscribed = false;
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
});

async function refreshAccessToken(token) {
  try {
    const url = "https://id.twitch.tv/oauth2/token";
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();
    if (!response.ok) {
      throw refreshedTokens;
    }

    // Vérifier si l'utilisateur est abonné lors du rafraîchissement du jeton
    const subscriptionsResponse = await fetch(`https://api.twitch.tv/helix/subscriptions/user?broadcaster_id=${process.env.BROADCASTER_ID}&user_id=${token.id}`, {
      method: 'GET',
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${refreshedTokens.access_token}`
      }
    });

    if (subscriptionsResponse.ok) {
      const responseData = await subscriptionsResponse.json();
      token.isSubscribed = responseData.data.length > 0 ? responseData.data[0].tier : false;
    } else {
      token.isSubscribed = false;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + 3600000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fallback to old refresh token
    };
  } catch (error) {
    console.error(error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

