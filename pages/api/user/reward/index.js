import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import { getToken } from "next-auth/jwt";
import verifySignature from '../../verifySignature';
import isDateBeforeToday from '../../verifyDate';
import axios from 'axios';

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

export default async function handler(req, res) {
    try {
        const nextToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

        if (!nextToken) {
            return res.status(401).json({ message: 'Utilisateur non authentifié' });
        }
  
        let accessToken = nextToken.accessToken;
        if (!accessToken) {
            return res.status(401).json({ message: 'Token non fourni' });
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

        await runMiddleware(req, res, corsMiddleware);

        if (req.method === 'GET') {
            const user = await prisma.pets.findUnique({
                where: {
                    userId: decoded.id
                }
            });
            const urlSub = `https://api.twitch.tv/helix/subscriptions/user?broadcaster_id=${process.env.BROADCASTER_ID}&user_id=${decoded.id}`;
            const subscriptionsResponse = await axios.get(urlSub, {
                headers: {
                    'Client-ID': process.env.TWITCH_CLIENT_ID,
                    'Authorization': `Bearer ${accessToken}`
                }
                });
            const subs = subscriptionsResponse?.data;
            if (subs.data.length > 0 && isDateBeforeToday(user.reward)) {
                let points;
                switch (subs.data[0].tier) {
                    case "2000":
                        points = 200;
                        break;
                    case "3000":
                        points = 600;
                        break;
                    default:
                        points = 100;
                        break;
                }
                // Ajouter point utilisateur et mettre à jour reward
                const userRewarded = await prisma.pets.update({
                    where: {
                        userId: decoded.id
                    },
                    data: {
                        pointsUsed: {
                            decrement: points
                        },
                        reward: new Date()
                    }
                });
                return res.status(200).json({ message : `Vous avez obtenue ${points} OC`, user : userRewarded });
            } else {
                return res.status(400).json({ message: 'Vous devez être abonné pour obtenir une récompense' });
            }
        } else {
            return res.status(405).json({ message: 'Méthode non autorisée' });
        }
    } catch (err) {
        onError(err, res);
    } finally {
        await prisma.$disconnect();
    }
}