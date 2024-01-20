import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import Pusher from "pusher";

// Initialiser le midleware Cors
const cors = Cors({
    methods: ['GET', 'POST', 'HEAD'],
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

// pages/api/pusher/index.js

const pusher = new Pusher({
    appId: `${process.env.PUSHER_APP_ID}`,
    key: `${process.env.PUSHER_APP_KEY}`,
    secret: `${process.env.PUSHER_APP_SECRET}`,
    cluster: `${process.env.PUSHER_APP_CLUSTER}`,
    useTLS: true
});

export default async function handler(req, res) {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const { duelId } = req.body;
        if (!duelId) {
            return res.status(400).json({ message: 'Identifiant du duel non fourni' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ message: 'Token invalide' });
        }
        await runMiddleware(req, res, cors)
        switch (req.method) {
            case 'POST':
                const { socket_id, user } = req.body;
                const auth = pusher.authenticateUser(socket_id, user);
                res.send(auth);
                break;
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) { onError(err, res) }
    finally { await prisma.$disconnect() }
}

