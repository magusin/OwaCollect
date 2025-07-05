import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import { getToken } from "next-auth/jwt";
import verifySignature from '../../../verifySignature';
import calculatePoints from '../../../calculatePoints';

// Initialiser le midleware Cors
const allowedOrigins = [process.env.NEXTAUTH_URL]
const corsOptions = {
    methods: ['GET', 'HEAD'],
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  };

const prisma = new PrismaClient();

const corsMiddleware = Cors(corsOptions);

// Gestion des erreurs
function onError(err, res) {
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Token invalide' });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expiré' });
    }

    res.status(500).json({ error: err.message })
}

// Gestion des requêtes
async function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result)
            }
            return resolve(result)
        })
    })
}

// GET /api/user/card/leaderboard

export default async function handler(req, res) {
  try {
    await runMiddleware(req, res, corsMiddleware);

    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Méthode non autorisée' });
    }

    const nextToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!nextToken) return res.status(401).json({ message: 'Utilisateur non authentifié' });

    const signature = await verifySignature(req);
    if (!signature) return res.status(400).json({ message: 'Signature invalide' });

    // 1. Récupérer toutes les playercards sauf les bannis
    const allCards = await prisma.playercards.findMany({
      where: {
        petId: {
          notIn: ['165781486', '75524984']
        }
      },
      select: {
        petId: true,
        isGold: true,
      }
    });

    // 2. Grouper par petId et compter total et gold
    const playerMap = new Map();

    for (const { petId, isGold } of allCards) {
      if (!playerMap.has(petId)) {
        playerMap.set(petId, { cardCount: 0, goldCardCount: 0 });
      }
      const data = playerMap.get(petId);
      data.cardCount += 1;
      if (isGold) data.goldCardCount += 1;
    }

    const petIds = Array.from(playerMap.keys());

    // 3. Récupérer les infos des joueurs
    const pets = await prisma.pets.findMany({
      where: { userId: { in: petIds } },
      select: { userId: true, name: true, imageUrl: true }
    });

    // 4. Fusionner les données
    const leaderboard = petIds.map(petId => {
      const petInfo = pets.find(p => p.userId === petId);
      const { cardCount, goldCardCount } = playerMap.get(petId);
      return {
        petId,
        name: petInfo?.name,
        imageUrl: petInfo?.imageUrl,
        cardCount,
        goldCardCount,
      };
    }).sort((a, b) => b.cardCount - a.cardCount); // tri décroissant

    return res.status(200).json(leaderboard);
  } catch (err) {
    onError(err, res);
  }
}