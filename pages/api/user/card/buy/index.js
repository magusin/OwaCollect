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

// PUT /api/user/card/buy

export default async function handler(req, res) {
    try {
    const token = req.headers.authorization?.split(' ')[1]; // JWT envoyé dans le header Authorization
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
                const { id, cost } = req.body;
              
                if (!id) {
                    return res.status(400).json({ message: 'Id de la carte non fourni' });
                }

                if (!cost) {
                    return res.status(400).json({ message: 'Coût de l\'oppération non fourni' });
                }

                // créer la carte dans la table playercards
                const playerCreateCard = await prisma.playercards.create({
                    data: {
                        petId: decoded.id,
                        cardId: id,
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
                
                return res.status(200).json({ updatedCard: playerCreateCard, allPlayerCards, userData });
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) { onError(err, res) }
    finally { await prisma.$disconnect() }
}