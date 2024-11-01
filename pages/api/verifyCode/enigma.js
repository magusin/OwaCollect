import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getToken } from "next-auth/jwt";
import verifySignature from '../verifySignature';

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

// POST /api/verifyCode/enigma

export default async function handler(req, res) {
    try {
        const nextToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

        if (!nextToken) {
            return res.status(401).json({ message: 'Utilisateur non authentifié' });
        }
        const token = req.headers.authorization?.split(' ')[1]; // JWT envoyé dans le header Authorization
        if (!token) {
            return res.status(401).json({ message: 'Token non fourni' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ message: 'Token invalide' });
        }
        const signature = await verifySignature(req);
        if (!signature) {
            return res.status(400).json({ message: 'Signature invalide' });
        }
        await runMiddleware(req, res, corsMiddleware)
        switch (req.method) {
            case 'POST':
                const userCode = req.body.code;
                if (!userCode) {
                    return res.status(400).json({ message: 'Code non fourni' });
                }
                else if (userCode.toLowerCase() === '2106') {
                    const secretAlreadyDiscovered = await prisma.secretsdiscovered.findUnique({
                        where: { userId_secretId: { userId: decoded.id, secretId: 18 } }
                    });

                    if (!secretAlreadyDiscovered) {
                        await prisma.secretsdiscovered.create({
                            data: {
                                userId: decoded.id,
                                secretId: 18
                            }
                        });
                        // créer la carte dans la table playercards
                        const rewardCard = await prisma.playercards.findUnique({
                            where: {
                                petId_cardId: {
                                    petId: decoded.id,
                                    cardId: 66
                                }
                            }
                        });

                        if (!rewardCard) {
                            await prisma.playercards.create({
                                data: {
                                    petId: decoded.id,
                                    cardId: 66,
                                    count: 1,
                                    isNew: true
                                }
                            });
                        } else {
                            await prisma.playercards.update({
                                where: {
                                    petId_cardId: {
                                        petId: decoded.id,
                                        cardId: 66
                                    }
                                },
                                data: {
                                    count : {increment: 1}
                                }
                            });
                        }
                        return res.status(200).json({ success: true, message: 'Vous avez débloquez la porte et obtenu la carte 66 (Elden Ring)', secret18: true });
                    } else {
                        return res.status(200).json({ success: false, message: 'Vous avez déjà ouvert la porte' });
                    }
                } else {
                    return res.status(200).json({ success: false, message: 'Rien ne se passe' });
                }
            default:
                res.setHeader('Allow', ['POST'])
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) {
        onError(err, res)
    }
    finally { await prisma.$disconnect() }
}

