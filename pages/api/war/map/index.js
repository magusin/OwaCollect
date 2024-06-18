import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import { getToken } from "next-auth/jwt";
import { getTilesandCoordinates } from '../fight';

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

                // // Vérifier si les paramètres de requête sont présents
                if (!limit || !mapId) {
                    return res.status(400).json({ message: 'Les paramètres de requête sont manquants' });
                }

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
                
                // Récupérer les coordonnées des tuiles autour du joueur
                const { tiles, allCoordinates } = await getTilesandCoordinates(mapPlayer);


                res.status(200).json({ tiles, allCoordinates });
                break
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) { onError(err, res) }
    finally { await prisma.$disconnect() }
}