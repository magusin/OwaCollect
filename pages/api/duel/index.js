import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { doc, setDoc } from "firebase/firestore";
import { db } from '../firebaseAdmin';
import { getToken } from "next-auth/jwt";
import verifySignature from '../verifySignature';
import calculatePoints from '../calculatePoints';

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

// POST api/duel (create duel)

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
            case 'POST':
                const uuid = uuidv4();
                const link = process.env.NEXTAUTH_URL + '/duel/' + uuid;
                const duel = await prisma.duels.create({
                    data: {
                        uuid: uuid,
                        player1Id: decoded.id
                    }
                })

                const deckP1 = await prisma.playercards.findMany({
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

                const duelRef = db.collection("duel").doc(uuid);

                // Utilisation de la méthode 'set' pour écrire dans Firestore avec Firebase Admin SDK
                await duelRef.set({
                    duelId: uuid,
                    player1Name: decoded.name,
                    player1Id: decoded.id,
                    player2Id: null,
                    winnerId: null,
                    deckP1: deckP1,
                    bet: 0,
                });
                res.status(200).json({ duel, link })
                break;
            default:
                res.setHeader('Allow', ['POST'])
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) {
        onError(err, res)
    }
    finally { await prisma.$disconnect() }
}