import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import { getToken } from "next-auth/jwt";

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
// GET /api/user/deck
// PUT /api/user/deck
export default async function handler(req, res) {
    try {
        const nextToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

        if (!nextToken) {
            return res.status(400).json({ message: 'Utilisateur non authentifié' });
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
            case 'GET':
                // Récupérer les cartes du deck du joueur
                const playerCard = await prisma.playercards.findMany({
                    where: {
                        petId: decoded.id
                    },
                    include: {
                        card: {
                            include: {
                                passifcards: {
                                    include: {
                                        passif: true
                                    }
                                }
                            }
                        }
                    }
                });

                res.status(200).json(playerCard);
                break
            case 'PUT':
                const { deck } = req.body;
                if (!deck) {
                    return res.status(400).json({ message: 'Deck non fourni' });
                }

                // Mettre à jour le deck du joueur
                await prisma.playercards.updateMany({
                    where: {
                        petId: decoded.id,
                        isInDeck: true
                    },
                    data: {
                        isInDeck: false
                    }
                });

                // Mettre à jour isInDeck pour les cartes dans le deck
                for (const cardId of deck) {
                    await prisma.playercards.update({
                        where: {
                            petId_cardId: {
                                petId: decoded.id,
                                cardId: cardId
                            }
                        },
                        data: {
                            isInDeck: true
                        }
                    });
                }

                res.status(200).json({ message: 'Deck mis à jour avec succès' });
                break
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) { onError(err, res) }
    finally { await prisma.$disconnect() }
}