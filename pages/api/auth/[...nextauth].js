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
      try {
        // Persist the OAuth access_token and or the user id to the token right after signin     
        if (account && user) {
          console.log('profile: ', profile)
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
          // Obtenir les informations d'abonnement de l'utilisateur
          const urlSubs = `https://api.twitch.tv/helix/subscriptions/user?broadcaster_id=${process.env.BROADCASTER_ID}&user_id=${token.id}`;
          const subscriptionResponse = await fetch(urlSubs, {
            method: 'GET',
            headers: {
              'Client-ID': process.env.TWITCH_CLIENT_ID,
              'Authorization': `Bearer ${account.access_token}`
            }
          });

          const resData = await subscriptionResponse.json();
          console.log('resData:', resData)
            const isSub = resData.data.length > 0;
            if (isSub) {
            token.isSubscribed = isSub;
            } else {
              token.isSubscribed = false;
            }
          }
        } catch (error) {
          console.error(error);
          return {
            ...token,
            error: "SubsError",
          };
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
      console.log('session: ', session)
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

