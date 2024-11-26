import Cors from 'cors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { getToken } from 'next-auth/jwt';
import verifySignature from '../../verifySignature';
import axios from 'axios';
import isDateBeforeToday from '../../../../utils/verifyDate';

// Initialiser Prisma
const prisma = new PrismaClient();

// Initialiser le middleware Cors
const allowedOrigins = [process.env.NEXTAUTH_URL];
const corsOptions = {
  methods: ['GET', 'HEAD'],
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

const corsMiddleware = Cors(corsOptions);

// Middleware Cors
async function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Gestion des erreurs
function onError(err, res) {
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Token invalide' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expiré' });
  }
  res.status(500).json({ error: err.message });
}

export default async function handler(req, res) {
    console.log('req', req)
  try {
    // Authentification via NextAuth
    const nextToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!nextToken) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    const accessToken = nextToken.accessToken;
    if (!accessToken) {
      return res.status(401).json({ message: 'Token non fourni' });
    }

    // Vérification de la signature
    const signature = await verifySignature(req);
    if (!signature) {
      return res.status(400).json({ message: 'Signature invalide' });
    }

    // Validation JWT
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token non fourni' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: 'Token invalide' });
    }

    // Middleware Cors
    await runMiddleware(req, res, corsMiddleware);

    // Gestion des requêtes GET
    if (req.method === 'GET') {
      // Récupération de l'utilisateur
      const user = await prisma.pets.findUnique({
        where: { userId: decoded.id },
      });

      if (!user) {
        return res.status(404).json({ message: 'Utilisateur introuvable' });
      }

      // Vérification de l'abonnement Twitch
      const urlSub = `https://api.twitch.tv/helix/subscriptions/user?broadcaster_id=${process.env.BROADCASTER_ID}&user_id=${decoded.id}`;
      const subscriptionsResponse = await axios.get(urlSub, {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const subs = subscriptionsResponse?.data;
      if (!subs || subs.data.length === 0) {
        return res.status(400).json({ message: 'Vous devez être abonné pour obtenir une récompense' });
      }

      // Vérification de la dernière récompense
      if (isDateBeforeToday(user.reward)) {
        let points;
        switch (subs.data[0].tier) {
          case '2000':
            points = 200;
            break;
          case '3000':
            points = 600;
            break;
          default:
            points = 100;
        }

        // Mise à jour des points et de la récompense
        const userRewarded = await prisma.pets.update({
          where: { userId: decoded.id },
          data: {
            pointsUsed: {
              decrement: points,
            },
            reward: new Date(),
          },
        });

        return res.status(200).json({ message: `Vous avez obtenu ${points} OC`, user: userRewarded });
      } else {
        return res.status(400).json({ message: 'Vous avez déjà réclamé votre récompense pour aujourd\'hui.' });
      }
    } else {
      return res.status(405).json({ message: 'Méthode non autorisée' });
    }
  } catch (err) {
    onError(err, res);
  } finally {
    await prisma.$disconnect();
  }
}