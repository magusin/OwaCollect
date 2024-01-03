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

// POST /api/verifyCode

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
                const userCode = req.body.code;
                console.log(userCode)
                const secretCode = process.env.SECRET_CODE;
                if (userCode.toLowerCase() === secretCode) {
                    const secretShopLink = uuidv4();
                    return res.status(200).json({ success: true, secretShopLink: secretShopLink });
                } else {
                    return res.status(200).json({ success: false });
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

