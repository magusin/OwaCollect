import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';

// Initialiser le midleware Cors
const cors = Cors({
    methods: ['GET', 'PUT', 'HEAD'],
})

const prisma = new PrismaClient()

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

// GET /api/product
export default async function handler(req, res) {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token non fourni' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ message: 'Token invalide' });
        }
        await runMiddleware(req, res, cors)
        switch (req.method) {
            case 'GET':
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
                const { id, cost } = req.body;
                if (!id) {
                    return res.status(400).json({ message: 'Id de la carte non fourni' });
                }

                if (!cost) {
                    return res.status(400).json({ message: 'Coût de l\'oppération non fourni' });
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