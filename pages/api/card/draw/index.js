import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import { getToken } from "next-auth/jwt";
import verifySignature from '../../verifySignature';
import calculatePoints from '../../calculatePoints';

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

// POST /api/card/draw

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
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token non fourni' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ message: 'Token invalide ou expiré' });
        }
        await runMiddleware(req, res, corsMiddleware)
        switch (req.method) {
            case 'POST':
                const { quantity, category, cost } = req.body;
                if (typeof quantity !== 'number' || typeof category !== 'string' || typeof cost !== 'number') {
                    return res.status(400).json({ message: 'Invalid input types' });
                }
                if (quantity < 1 || quantity > 5) {
                    return res.status(400).json({ message: 'Quantité invalide' });
                }
                if (quantity * 500 != cost) {
                    return res.status(400).json({ message: 'Prix invalide' });
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
                const cards = await prisma.card.findMany({
                    where: {
                        category: category,
                        isDraw: true
                    }
                })
                const totalDropRate = cards[cards.length - 1].dropRate;

                const selectRandomCard = () => {
                    let randomNum = Math.random() * totalDropRate;
                    for (const card of cards) {
                        if (randomNum - card.dropRate <= 0) {
                            return card;
                        }
                    }
                };

                const selectedCards = [];
                for (let i = 0; i < 5 * quantity; i++) {
                    const randomCard = selectRandomCard()
                    selectedCards.push(randomCard);
                }

                const selectedCardsMap = selectedCards.reduce((acc, card) => {
                    if (!acc[card.id]) {
                        acc[card.id] = { ...card, count: 0 };
                    }
                    acc[card.id].count += 1;
                    return acc;
                }, {});

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

                const transactionPromises = Object.values(selectedCardsMap).map(card =>
                    prisma.playercards.upsert({
                        where: {
                            petId_cardId: {
                                petId: decoded.id,
                                cardId: card.id
                            }
                        },
                        update: {
                            count: {
                                increment: card.count
                            }
                        },
                        create: {
                            petId: decoded.id,
                            cardId: card.id,
                            count: card.count
                        }
                    })
                );

                await prisma.$transaction(transactionPromises);

                res.status(200).json({ selectedCards, userData })
                break
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) { onError(err, res) }
    finally { await prisma.$disconnect() }
}