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

// GET api/duel/[id]/status
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
            return res.status(401).json({ message: 'Token invalide' });
        }
        const duelId = req.query.id;
        if (!duelId) {
            return res.status(400).json({ message: 'Identifiant du duel non fourni' });
        }
        const duelDoc = await db.collection('duel').doc(duelId).get();

        if (!duelDoc.exists) {
            return res.status(404).json({ message: 'Duel non trouvé' });
        }

        const duelData = duelDoc.data();
        const isPlayerOne = decoded.id === duelData.player1Id;
        const isPlayerTwo = decoded.id === duelData.player2Id;

        if (!isPlayerOne && !isPlayerTwo) {
            return res.status(403).json({ message: 'Vous n\'êtes pas un joueur de ce duel' });
        }

        await runMiddleware(req, res, corsMiddleware)
        switch (req.method) {
            case 'POST':
                const { passifs } = req.body;
                if (!passifs) {
                    return res.status(400).json({ message: 'Passif non fourni' });
                }

                if (typeof passifs !== 'object' || Object.values(passifs).some(p => typeof p !== 'object')) {
                    return res.status(400).json({ message: 'Format de passif invalide' });
                }

                const passifFusionne = Object.values(passifs).reduce((acc, cur) => {
                    Object.keys(cur.passif).forEach(key => {
                        acc[key] = (acc[key] || 0) + cur.passif[key];
                    });
                    return acc;
                }, {});

                const duelRef = db.collection('duel').doc(duelId);

                const otherPlayerPassifsField = isPlayerOne ? 'passifsJ2' : 'passifsJ1';
                const currentPlayerPassifsField = isPlayerOne ? 'passifsJ1' : 'passifsJ2';

                // Vérifier si l'autre joueur a déjà enregistré ses passifs
                const otherPlayerHasRegisteredPassifs = !!duelData[otherPlayerPassifsField];

                await duelRef.update({
                    [currentPlayerPassifsField]: passifFusionne
                });
                
                if (otherPlayerHasRegisteredPassifs) {
                    // Initialiser un timer si l'autre joueur a déjà enregistré ses passifs
                    const startTime = admin.firestore.FieldValue.serverTimestamp(); // Timestamp actuel
                    await duelRef.update({
                        startTime: startTime,
                        timerDuration: 200,
                        statut: 'spell'
                    });
                }

                return res.status(200).json({ message: 'Passif enregistré' });

        }

    } catch (err) {
        onError(err, res)
    }
    finally { await prisma.$disconnect() }
}