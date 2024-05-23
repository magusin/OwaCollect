import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import { getToken } from "next-auth/jwt";

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

// GET /api/war/player
export default async function handler(req, res) {
    try {
        const nextToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

        if (!nextToken) {
            return res.status(401).json({ message: 'Utilisateur non authentifié' });
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
            case 'GET':
        try {
            const existingUser = await prisma.warPlayers.findUnique({
                where: { petId: decoded.id },
                include: {
                    map: true,
                    warPlayerSkills: {
                        include: { warSkills: true }
                    }
                }
            });

            if (existingUser) {
                return res.status(200).json(existingUser);
            } else {
                // Créer le joueur
                const createPlayer = await prisma.warPlayers.create({
                    data: {
                        petId: decoded.id,
                        name: decoded.name,
                        imageUrl: decoded.image,
                        mapId: Math.floor(Math.random() * 121) + 1
                    }
                });

                // Ajouter une compétence initiale pour le joueur
                await prisma.warPlayerSkills.create({
                    data: {
                        petId: createPlayer.petId,
                        skillId: 1,
                        createdAt: new Date() // Date de création
                    }
                });

                // Récupérer le joueur avec ses compétences mises à jour
                const newPlayer = await prisma.warPlayers.findUnique({
                    where: { petId: decoded.id },
                    include: {
                        map: true,
                        warPlayerSkills: {
                            include: { warSkills: true }
                        }
                    }
                });

                return res.status(200).json(newPlayer);
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    default:
        res.status(405).end(`Method ${req.method} Not Allowed`);
}
    } catch (err) { onError(err, res) }
    finally { await prisma.$disconnect() }
}