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
        if (req.method === 'GET') {
            const nextToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

            if (!nextToken) {
                return res.status(401).json({ message: 'Utilisateur non authentifié' });
            }
            const signature = await verifySignature(req);
            if (!signature) {
                return res.status(400).json({ message: 'Signature invalide' });
            } 
            // Step 1: Aggregate player cards to get petIds and counts
    const leaderboardAggregate = await prisma.playercards.groupBy({
        by: ['petId'],
        _count: {
          cardId: true
        },
        orderBy: {
          _count: {
            cardId: 'desc'
          }
        },
        where: {
          petId: {
            notIn: ['165781486', '75524984']
          }
        }
      });
  
      // Extract petIds for querying pets
      const petIds = leaderboardAggregate.map(item => item.petId);
  
      // Step 2: Fetch pets with those petIds
      const pets = await prisma.pets.findMany({
        where: {
          userId: {
            in: petIds
          }
        },
        select: {
          userId: true, // Make sure to select fields you need
          name: true,
          imageUrl: true,
          // Include additional fields as necessary
        }
      });
  
      // Merge leaderboard aggregate data with pets info
      const leaderboard = leaderboardAggregate.map(item => {
        const petInfo = pets.find(pet => pet.userId === item.petId);
        return {
          petId: item.petId,
          cardCount: item._count.cardId,
          name: petInfo?.name,
          imageUrl: petInfo?.imageUrl
        };
      });
            return res.status(200).json(leaderboard);
        } else {
            return res.status(405).json({ message: 'Méthode non autorisée' });
        }
    } catch (err) {
        onError(err, res);
    }
}