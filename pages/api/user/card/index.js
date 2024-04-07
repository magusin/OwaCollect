import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import { getToken } from "next-auth/jwt";
import verifySignature from '../../verifySignature';
import calculatePoints from '../../calculatePoints';

// Initialiser le midleware Cors
const allowedOrigins = [process.env.NEXTAUTH_URL]
const corsOptions = {
    methods: ['GET', 'PUT', 'HEAD'],
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

// GET /api/user/card
export default async function handler(req, res) {
    try {
        const nextToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!nextToken) {
            return res.status(400).json({ message: 'Utilisateur non authentifié' });
        }
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token non fourni' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ message: 'Token invalide' });
        }
        await runMiddleware(req, res, corsMiddleware)
        switch (req.method) {
            case 'GET':
                // Récupérer toutes les cartes
                const cards = await prisma.card.findMany()

                // Récupérer les cartes du joueur
                const playerCards = await prisma.playercards.findMany({
                    where: {
                        petId: decoded.id
                    },
                    include: {
                        card: true // Inclut les détails des cartes
                    }
                });

                // Renvoyer les produits et les cartes du joueur
                res.status(200).json({ cards, playerCards });
                break
            case 'PUT':
                const signature = await verifySignature(req);
                if (!signature) {
                    return res.status(400).json({ message: 'Signature invalide' });
                }
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

                const card = await prisma.playercards.findUnique({
                    where: {
                        petId_cardId: {
                            petId: decoded.id,
                            cardId: id
                        }
                    },
                    include: {
                        card: true
                    }
                });

                if (!card.card.evolveCost) {
                    return res.status(400).json({ message: 'Cette carte ne peut pas level Up' });
                }

                if (card.count < 3) {
                    return res.status(400).json({ message: 'Vous n\'avez pas assez de cartes' });
                }

                if (card.card.evolveCost != cost) {
                    return res.status(400).json({ message: 'Coût invalide' });
                }

                const user = await prisma.pets.findUnique({
                    where: {
                        userId: decoded.id
                    }
                });

                // Calculer les points disponibles
                const availablePoints = await calculatePoints(user);
                // Vérifier si l'utilisateur a assez de points
                if (cost > availablePoints) {
                    return res.status(400).json({ message: 'Pas assez de points' });
                }

                // Réduire le count de la carte actuelle de 2
                await prisma.playercards.update({
                    where: {
                        petId_cardId: {
                            petId: decoded.id,
                            cardId: id
                        }
                    },
                    data: {
                        count: {
                            decrement: 2
                        }
                    }
                });

                // Augmenter le count de la carte suivante
                const playerCardsEdit = await prisma.playercards.upsert({
                    where: {
                        petId_cardId: {
                            petId: decoded.id,
                            cardId: id + 1
                        }
                    },
                    update: {
                        count: {
                            increment: 1
                        }
                    },
                    create: {
                        petId: decoded.id,
                        cardId: id + 1,
                        count: 1
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

                res.status(200).json({ updatedCard: playerCardsEdit, allPlayerCards, userData });
                break
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) { onError(err, res) }
    finally { await prisma.$disconnect() }
}