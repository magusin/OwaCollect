import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import { getToken } from "next-auth/jwt";
import { finalStats, getTilesandCoordinates } from '../../fight';
import calculatePoints from '../../../calculatePoints';

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

// POST /api/war/player/resurrect
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

                // Récupérer les données du joueur
                const player = await prisma.warPlayers.findUnique({
                    where: {
                        petId: decoded.id
                    },
                });

                if (!player) {
                    return res.status(404).json({ message: 'Joueur non trouvé' });
                }

                if (player.isDied === null) {
                    return res.status(400).json({ message: 'Joueur déjà vivant' });
                }

                // Vérifier si la dâte de résurrection est dépassée
                const now = new Date();
                const resurrectDate = new Date(player.isDied);

                if (now < resurrectDate) {
                    const user = await prisma.pets.findUnique({
                        where: {
                            userId: decoded.id
                        }
                    });

                    // Calculer les points disponibles
                    const availablePoints = await calculatePoints(user);

                    if (availablePoints < player.level * 10) {
                        return res.status(400).json({ message: 'Pas assez de points disponibles' });
                    }

                    // Déduire les points du joueur
                    const userData = await prisma.pets.update({
                        where: {
                            userId: decoded.id
                        },
                        data: {
                            pointsUsed: {
                                increment: player.level * 10
                            }
                        }
                    });

                    // Réinitialiser les hp du joueur et sa position
                    const playerResurrect = await prisma.warPlayers.update({
                        where: {
                            petId: decoded.id
                        },
                        data: {
                            hp: player.hpMax,
                            isDied: null,
                            mapId: Math.floor(Math.random() * 400) + 1
                        },
                        include: {
                            map: true,
                            warPlayerSkills: {
                                include: { warSkills: true }
                            },
                            warMessages: {
                                orderBy: { createdAt: "desc" }
                            }
                        }
                    });

                    // Récupérer les coordonnées des tuiles autour du joueur
                    const { tiles, allCoordinates } = await getTilesandCoordinates(playerResurrect.map);

                    return res.status(200).json({ message: `Vous avez ressuscité pour ${player.level * 10} OC`, playerResurrect, tiles, allCoordinates, type: 'success', totalPoints: availablePoints - player.level * 10 });
                }

                // Réinitialiser les hp du joueur et sa position
                const playerResurrect = await prisma.warPlayers.update({
                    where: {
                        petId: decoded.id
                    },
                    data: {
                        hp: player.hpMax,
                        isDied: null,
                        mapId: Math.floor(Math.random() * 400) + 1
                    },
                    include: {
                        map: true,
                        warPlayerSkills: {
                            include: { warSkills: true }
                        },
                        warMessages: {
                            orderBy: { createdAt: "desc" }
                        }
                    }
                });

                // Récupérer les coordonnées des tuiles autour du joueur
                const { tiles, allCoordinates } = await getTilesandCoordinates(playerResurrect.map);

                return res.status(200).json({ message: `Vous avez ressuscité`, playerResurrect, tiles, allCoordinates, type: 'success'  });
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) { onError(err, res) }
    finally { await prisma.$disconnect() }
}