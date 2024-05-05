import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import { getToken } from "next-auth/jwt";
import { all } from 'axios';

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

// GET /api/war/map
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
                const { limit, mapId } = req.query;

                // Convertir les valeurs des paramètres en nombres
                const limitValue = parseInt(limit);
                const mapIdValue  = parseInt(mapId);

                // Vérifier si les paramètres sont valides
                if (isNaN(limitValue) || isNaN(mapIdValue)) {
                    return res.status(400).json({ message: 'Les paramètres de requête sont invalides' });
                }
                
                const mapPlayer = await prisma.map.findFirst({
                    where: { id: mapIdValue },
                });
                
                
                if (!mapPlayer) {
                    return res.status(404).json({ message: 'Carte introuvable' });
                }
                
                const positionXValue = mapPlayer.position_x;
                const positionYValue = mapPlayer.position_y;
                
                // Déterminez les coordonnées de la plage de tuiles autour du joueur
                const startX = Math.max(1, positionXValue - limitValue);
                const endX = Math.min(11, positionXValue + limitValue);
                const startY = Math.max(1, positionYValue - limitValue);
                const endY = Math.min(11, positionYValue + limitValue);
                
                // Sélectionnez les tuiles dans la plage de coordonnées
                const tiles = await prisma.map.findMany({
                    where: {
                        position_x: { gte: startX, lte: endX },
                        position_y: { gte: startY, lte: endY },
                    },
                    include: {
                        warPlayers: true // Inclure les joueurs associés à chaque tuile
                    }
                });

                // Créer une liste de toutes les coordonnées possibles
                const allCoordinates = [];
                for (let x = positionXValue - 5; x <= positionXValue + 5; x++) {
                    for (let y = positionYValue - 5; y <= positionYValue + 5; y++) {
                        allCoordinates.push({ position_x: x, position_y: y });
                    }
                }

                // const players = await prisma.warPlayers.findMany({
                //     where: {
                //         AND: [
                //             { position_x: { gte: startX, lte: endX } },
                //             { position_y: { gte: startY, lte: endY } },
                //             { NOT: { petId: decoded.id } } // Exclure le joueur actuel
                //         ]
                //     },
                    
                // });
                res.status(200).json({ tiles, allCoordinates });
                break
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) { onError(err, res) }
    finally { await prisma.$disconnect() }
}