import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import Pusher from "@/utils/pusher";

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

// GET /api/pusher/test

export default async function handler(req, res) {
    try {
        
        const token = req.headers.authorization?.split(' ')[1];
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ message: 'Identifiant du duel non fourni' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ message: 'Token invalide' });
        }
        await runMiddleware(req, res, cors)
        switch (req.method) {
            case 'POST':
                const body = req.body
                if (body.connection_id) {
                    await Pusher.trigger(`channel-${body.id}`, 'joinP2', {
                        message: 'Joueur 2 a rejoin le duel'
                    });
                    return res.status(200).json({ message: 'hello world' });
                }
                console.log(body)
                await Pusher.trigger(`channel-${body.id}`, 'test', {
                    message: 'hello world'
                });
                return res.status(200).json({ message: 'hello world' });

            default:
                return res.status(405).json({ message: 'Méthode non autorisée' });
        }
    } catch (err) { onError(err, res) }
    finally { await prisma.$disconnect() }
}