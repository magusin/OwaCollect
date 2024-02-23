import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import { getToken } from "next-auth/jwt";
import verifySignature from '../../../verifySignature';
import calculatePoints from '../../../calculatePoints';

// Initialiser le midleware Cors
const allowedOrigins = [process.env.NEXTAUTH_URL]
const corsOptions = {
    methods: ['PUT', 'HEAD'],
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
                const { id } = req.body;

                if (!id) {
                    return res.status(400).json({ message: 'Id de la carte non fourni' });
                }

                if (typeof id !== 'number') {
                    return res.status(400).json({ message: 'Invalid input types' });
                }

                // Vérifier que la carte à minimum 4 exemplaires
                const card = await prisma.playercards.findFirst({
                    where: {
                        petId: decoded.id,
                        cardId: id
                    },
                    include: {
                        card: true
                    }
                });

                if (!card) {
                    return res.status(400).json({ message: 'Carte non possédée par le joueur' });
                }

                if (card.card.count < 4) {
                    return res.status(400).json({ message: 'Nombre de cartes insuffisant pour la forge' });
                }

                // Tirer une carte aléatoire de rareté égale à la carte sacrifiée
                const rarety = card.card.rarety;
                const category = card.card.category;

                const eligibleCards = await prisma.card.findMany({
                    where: {
                        AND: [
                            { rarety: rarety },
                            { isDraw: true },
                            { category: category },
                            { id: { not: id } } // Exclure l'id de la carte sacrifiée
                        ]
                    }
                });

                const randomCard = eligibleCards[Math.floor(Math.random() * eligibleCards.length)];

                // Supprimer 3 exemplaires de la carte sacrifiée
                await prisma.playercards.update({
                    where: {
                        petId_cardId: {
                            petId: decoded.id,
                            cardId: id
                        }
                    },
                    data: {
                        count: {
                            decrement: 3
                        }
                    }
                });

                // Ajouter la nouvelle carte
                const existingCard = await prisma.playercards.findFirst({
                    where: {
                        petId: decoded.id,
                        cardId: randomCard.id
                    }
                });

                if (existingCard) {
                    await prisma.playercards.update({
                        where: {
                            petId_cardId: {
                                petId: decoded.id,
                                cardId: randomCard.id
                            }
                        },
                        data: {
                            count: {
                                increment: 1
                            }
                        }
                    });
                } else {
                    await prisma.playercards.create({
                        data: {
                            petId: decoded.id,
                            cardId: randomCard.id,
                            count: 1,
                            isNew: true
                        }
                    });
                }
           

                // Récupérer toutes les cartes du joueur
                const allPlayerCards = await prisma.playercards.findMany({
                    where: {
                        petId: decoded.id
                    },
                    include: {
                        card: true
                    }
                });

                return res.status(200).json({ updatedCard: randomCard, allPlayerCards });
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) { onError(err, res) }
    finally { await prisma.$disconnect() }
}