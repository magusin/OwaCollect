import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import { getToken } from "next-auth/jwt";
import verifySignature from '../../../verifySignature';
import calculatePoints from '../../../calculatePoints';

// Initialiser le midleware Cors
const allowedOrigins = [process.env.NEXTAUTH_URL]
const corsOptions = {
    methods: ['POST', 'HEAD'],
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

// PUT /api/user/card/buy

export default async function handler(req, res) {
    try {
        const nextToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

        if (!nextToken) {
            return res.status(401).json({ message: 'Utilisateur non authentifié' });
        }
        const signature = await verifySignature(req);
        if (!signature) {
            return res.status(400).json({ message: 'Signature invalide' });
        }
        const token = req.headers.authorization?.split(' ')[1]; // JWT envoyé dans le header Authorization
        if (!token) {
            return res.status(401).json({ message: 'Token non fourni' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ message: 'Token invalide' });
        }
        await runMiddleware(req, res, corsMiddleware)
        switch (req.method) {
            case 'PUT':
                const { id, cost } = req.body;

                if (!id) {
                    return res.status(400).json({ message: 'Id de la carte non fourni' });
                }

                if (!cost) {
                    return res.status(400).json({ message: 'Coût de l\'oppération non fourni' });
                }

                if (typeof id !== 'number' || typeof cost !== 'number') {
                    return res.status(400).json({ message: 'Invalid input types' });
                }

                if (cost !== 500) {
                    return res.status(400).json({ message: 'Coût invalide' });
                }

                if (id != 74 && id != 99 && id != 100 && id != 230) {
                    return res.status(400).json({ message: 'Id invalide' });
                }

                // Vérifier si le joueur a assez de points
                const player = await prisma.pets.findUnique({
                    where: {
                        userId: decoded.id
                    }
                });

                // Calculer les points disponibles
                const availablePoints = await calculatePoints(player);

                if (availablePoints < cost) {
                    return res.status(400).json({ message: 'Points insuffisants' });
                }

                // créer la carte dans la table playercards
                const playerCreateCard = await prisma.playercards.create({
                    data: {
                        petId: decoded.id,
                        cardId: id,
                        count: 1,
                        isNew: true
                    }
                });

                // Déduire les points du joueur
                const userData = await prisma.pets.update({
                    where: {
                        userId: decoded.id
                    },
                    data: {
                        pointsUsed: {
                            increment: cost
                        }
                    }
                });

                // Récupérer toutes les cartes du joueur
                const allPlayerCards = await prisma.playercards.findMany({
                    where: {
                        petId: decoded.id
                    },
                    include: {
                        card: true
                    }
                });

                return res.status(200).json({ updatedCard: playerCreateCard, allPlayerCards, userData });
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) { onError(err, res) }
    finally { await prisma.$disconnect() }
}