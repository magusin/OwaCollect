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

// GET api/duel/[uuid]
// PUT api/duel/[uuid]

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
            case 'GET':
                const duelFind = await prisma.duels.findUnique({
                    where: {
                        uuid: req.query.id
                    },
                    include: {
                        pets_duels_player1IdTopets: true, // Inclure les informations de pets pour le joueur 1
                        pets_duels_player2IdTopets: true, // Inclure les informations de pets pour le joueur 2
                    }
                })

                const cardP1 = await prisma.playercards.findMany({
                    where: {
                        petId: decoded.id,
                        isInDeck: true
                    },
                    include: {
                        card: true
                    }
                })
                if (duelFind.player2Id != null) {
                const cardP2 = await prisma.playercards.findMany({
                    where: {
                        userId: duelFind.player2Id,
                        isInDeck: true
                    },
                    include: {
                        card: true
                    }
                })
                res.status(200).json({ duelFind, cardP1, cardP2 })
                break;
            }
                res.status(200).json({ duelFind, cardP1 })
                break;
            case 'PUT':
                const { bet } = req.body;

                if (bet === null || bet === undefined) {
                    return res.status(400).json({ message: 'Montant du duel non fourni' });
                }
                const duelUpdate = await prisma.duels.update({
                    where: {
                        uuid: req.query.id
                    },
                    data: {
                        player2Id: decoded.id
                    }
                })

                if (bet != 0) {
                    await prisma.pets.update({
                        where: {
                            userId: decoded.id
                        },
                        data: {
                            pointsUsed: {
                                increment: bet
                            }
                        }
                    });
                }
                res.status(200).json(duelUpdate)
                break;
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) {
        onError(err, res)
    }
    finally { await prisma.$disconnect() }
}