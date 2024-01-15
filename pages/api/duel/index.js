import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Initialiser le midleware Cors
const cors = Cors({
    methods: ['POST', 'HEAD'],
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

// POST api/duel (create duel)

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
            case 'POST':
                const uuid = uuidv4();
                const link = process.env.NEXTAUTH_URL + '/duel/' + uuid;
                const duel = await prisma.duels.create({
                    data: {
                        uuid: uuid,
                        player1Id: {
                            id: decoded.id
                        }
                    }
                })
                res.status(200).json({duel, link})
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