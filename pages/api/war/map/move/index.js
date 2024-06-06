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

// GET /api/war/map/move

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
            return res.status(401).json({ message: 'Token invalide' });
        }

        await runMiddleware(req, res, corsMiddleware);
        switch (req.method) {
            case 'GET':
                const { direction } = req.query;

                if (!direction || (direction != 'up' && direction != 'down' && direction != 'left' && direction != 'right')) {
                    return res.status(400).json({ message: 'Direction non fournie' });
                }

                const user = await prisma.warPlayers.findUnique({
                    where: { petId: decoded.id },
                    include: { map: true }
                });

                if (!user) {
                    return res.status(404).json({ message: 'Utilisateur non trouvé' });
                }

                let playerX = user.map.position_x
                let playerY = user.map.position_y

                switch (direction) {
                    case 'up':
                        playerY -= 1
                        break;
                    case 'down':
                        playerY += 1
                        break;
                    case 'left':
                        playerX -= 1
                        break;
                    case 'right':
                        playerX += 1
                        break;
                }

                if (playerX < 1 || playerY < 1 || playerX > 11 || playerY > 11) {
                    return res.status(400).json({ message: 'Déplacement impossible' });
                }

                const mapDestination = await prisma.map.findFirst({
                    where: { position_x: playerX, position_y: playerY }
                });

                if (!mapDestination) {
                    return res.status(404).json({ message: 'Destination non trouvée' });
                }

                const updatedUser = await prisma.warPlayers.update({
                    where: { petId: decoded.id },
                    include: { map: true },
                    data: {
                        mapId: mapDestination.id
                    }
                });

                // Déterminez les coordonnées de la plage de tuiles autour du joueur
                const startX = Math.max(1, playerX - 5);
                const endX = Math.min(11, playerX + 5);
                const startY = Math.max(1, playerY - 5);
                const endY = Math.min(11, playerY + 5);

                // Sélectionnez les tuiles dans la plage de coordonnées
                const tiles = await prisma.map.findMany({
                    where: {
                        position_x: { gte: startX, lte: endX },
                        position_y: { gte: startY, lte: endY },
                    },
                    include: {
                        warPlayers: {
                            select: {
                                petId: true,
                                name: true,
                                imageUrl: true,
                                mapId: true,
                                level: true
                            }
                        }
                    }
                });

                // Créer une liste de toutes les coordonnées possibles
                const allCoordinates = [];
                for (let x = playerX - 5; x <= playerX + 5; x++) {
                    for (let y = playerY - 5; y <= playerY + 5; y++) {
                        allCoordinates.push({ position_x: x, position_y: y });
                    }
                }

                res.status(200).json({updatedUser, tiles, allCoordinates});
                break;
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) { onError(err, res) }
    finally { await prisma.$disconnect() }
}