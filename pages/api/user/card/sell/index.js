import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';

// Initialiser le midleware Cors
const cors = Cors({
    methods: ['PUT', 'HEAD'],
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

// PUT /api/user/card/sell
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
            case 'PUT':
                const { id, quantity, amount } = req.body;
                if (!id) {
                    return res.status(400).json({ message: 'Id de la carte non fourni' });
                }

                if (!quantity) {
                    return res.status(400).json({ message: 'Nombre de l\'oppération non fourni' });
                }

                if (!amount) {
                    return res.status(400).json({ message: 'Montant pour l\'oppération non fourni' });
                }

                // Réduire le count de la carte actuelle
                await prisma.playercards.update({
                    where: {
                        petId_cardId: {
                            petId: decoded.id,
                            cardId: id
                        }
                    },
                    data: {
                        count: {
                            decrement: quantity
                        }
                    }
                });

                // Déduire les points du joueur
                const userData = await prisma.pets.update({
                    where: {
                        userId: decoded.id
                    },
                    data: {
                        pointsUsed: {
                            decrement: amount
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

                res.status(200).json({ allPlayerCards, userData });
                break
            
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) { onError(err, res) }
    finally { await prisma.$disconnect() }
}