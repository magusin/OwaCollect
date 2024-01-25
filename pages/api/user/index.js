import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import { getToken } from "next-auth/jwt";
import verifySignature from '../verifySignature';

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

// GET /api/user

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
            case 'GET':
                const existingUser = await prisma.pets.findUnique({
                    where: { userId: decoded.id },
                });

                // Vérifier si le nom et l'image ont changé
                if (existingUser && existingUser.name !== decoded.name && existingUser.imageUrl !== decoded.image) {
                    const updatedUser = await prisma.pets.update({
                        where: {
                            userId: decoded.id
                        },
                        data: {
                            name: decoded.name,
                            imageUrl: decoded.image
                        }
                    })

                    // Retourner l'utilisateur mis à jour
                    res.status(200).json(updatedUser);
                } else if (existingUser && existingUser.name !== decoded.name) {
                    const updatedUser = await prisma.pets.update({
                        where: {
                            userId: decoded.id
                        },
                        data: {
                            name: decoded.name
                        }
                    })

                    // Retourner l'utilisateur mis à jour
                    res.status(200).json(updatedUser);
                } else if (existingUser && existingUser.imageUrl !== decoded.image) {
                    const updatedUser = await prisma.pets.update({
                        where: {
                            userId: decoded.id
                        },
                        data: {
                            imageUrl: decoded.image
                        }
                    })

                    // Retourner l'utilisateur mis à jour
                    res.status(200).json(updatedUser);
                } else {
                    if (existingUser) {
                        return res.status(200).json(existingUser);
                    } else {
                        const createPlayer = await prisma.pets.create({
                            data: {
                                userId: decoded.id,
                                name: decoded.name,
                                imageUrl: decoded.image,
                                subs: 0,
                                guess: 0,
                                bits: 0,
                                quiz: 0,
                                gifts: 0,
                                messages: 0,
                                guess: 0
                            }
                        })

                        res.status(200).json(createPlayer)
                    }
                }
                break
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) {
        onError(err, res)
    }
    finally { await prisma.$disconnect() }
}