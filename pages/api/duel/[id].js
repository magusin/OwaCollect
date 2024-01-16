import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Initialiser le midleware Cors
const cors = Cors({
    methods: ['GET', 'HEAD'],
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

// POST api/duel/[uuid] (create duel)

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
                    }
                })
                res.status(200).json(duelFind)
                break;
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) {
        onError(err, res)
    }
    finally { await prisma.$disconnect() }
}