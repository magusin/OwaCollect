import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import { getToken } from "next-auth/jwt";
import verifySignature from '../../verifySignature';
import calculatePoints from '../../calculatePoints';

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

    res.status(500).json({ message: err.message })
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
            case 'PUT':
                const cardId = req.body.cardId; 
            if (!cardId) {
                return res.status(400).json({ message: 'Carte non fournie' });
            }
            if (typeof cardId !== 'number') {
                return res.status(400).json({ message: 'Carte invalide' });
            }

            const isNew = await prisma.playercards.update({
                where: {
                    petId_cardId: {
                    petId: decoded.id,
                    cardId: cardId
                    }
                },
                data: {
                    isNew: false
                }

            });
                res.status(200).json({ isNew })
                break
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) { onError(err, res) }
    finally { await prisma.$disconnect() }
}