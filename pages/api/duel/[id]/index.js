import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import { getToken } from "next-auth/jwt";
import { db, admin } from '../../firebaseAdmin';
import verifySignature from '../../verifySignature';

/// Initialiser le midleware Cors
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

const prisma = new PrismaClient()

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

// GET api/duel/[uuid]
// PUT api/duel/[uuid]

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

                if (bet === null || bet === undefined || bet < 0 || bet > 500) {
                    return res.status(400).json({ message: 'Montant du duel non fourni ou invalide' });
                }

                if (typeof bet !== 'number') {
                    return res.status(400).json({ message: 'Invalid input type' });
                }

                const deckP2 = await prisma.playercards.findMany({
                    where: {
                        petId: decoded.id,
                        isInDeck: true
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
                })

                if (deckP2.length != 4) {
                    return res.status(400).json({ message: 'Votre deck doit contenir 4 cartes' });
                }

                await prisma.duels.update({
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

                const duelRef = db.collection("duel").doc(req.query.id);

                // Obtenez le timestamp actuel de Firebase
                const now = admin.firestore.FieldValue.serverTimestamp();

                await duelRef.update({
                    player2Id: decoded.id,
                    player2Name: decoded.name,
                    deckP2: deckP2,
                    statut: 'passif',
                    startTime: now,
                    duration: 60
                });
                res.status(200).json('put ok')
                break;
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) {
        onError(err, res)
    }
    finally { await prisma.$disconnect() }
}