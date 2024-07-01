import Cors from 'cors'
import { Prisma, PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import { getToken } from "next-auth/jwt";
import { xpToNextLevel } from '../../fight';

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

// POST /api/war/player/level

export default async function handler(req, res) {
    try {
        await runMiddleware(req, res, corsMiddleware);

        const nextToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

        if (!nextToken) {
            return res.status(401).json({ message: 'Utilisateur non authentifié' });
        }

        const token = req.headers.authorization?.split(' ')[1]; // JWT envoyé dans le header Authorization
        if (!token) {
            return res.status(401).json({ message: 'Token non fourni' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ message: 'Token invalide' });
        }

        switch (req.method) {
            case 'POST':

                const { choiceId } = req.body;

                if (!choiceId) {
                    return res.status(400).json({ message: 'L\'id du choix est manquant' });
                }

                const player = await prisma.warPlayers.findUnique({
                    where: {
                        petId: decoded.id
                    }
                });

                if (!player) {
                    return res.status(404).json({ message: 'Utilisateur non trouvé' });
                }

                if (!player.levelChoices) {
                    return res.status(400).json({ message: 'Aucun choix de niveau' });
                }

                const xpNeeded = xpToNextLevel(player.level);

                if (player.xp < xpNeeded) {
                    return res.status(400).json({ message: 'Expérience insuffisante' });
                }

                // Si le joueur possède bien le choix
                const choice = player.levelChoices.find(choice => choice.id === choiceId);

                if (!choice) {
                    return res.status(400).json({ message: 'Choix invalide' });
                }

                // Trouver le choix en question
                const choiceChoosen = await prisma.warLevelChoices.findUnique({
                    where: {
                        id: choiceId
                    }
                });
                // Donner les satistiques au joueur
                const updatedUser = await prisma.warPlayers.update({
                    where: {
                        petId: decoded.id
                    },
                    data: {
                        level: {
                            increment: 1
                        },
                        xp: {
                            decrement: xpNeeded
                        },
                        str: {
                            increment: choiceChoosen.str
                        },
                        intel: {
                            increment: choiceChoosen.intel
                        },
                        dex: {
                            increment: choiceChoosen.dex
                        },
                        acu: {
                            increment: choiceChoosen.acu
                        },
                        hpMax: {
                            increment: choiceChoosen.hp
                        },
                        hp: {
                            increment: choiceChoosen.hp
                        },
                        defP: {
                            increment: choiceChoosen.defP
                        },
                        defM: {
                            increment: choiceChoosen.defM
                        },
                        levelChoices: Prisma.JsonNull,
                    },
                    include: {
                        map: true,
                        warPlayerSkills: {
                            include: { warSkills: true }
                        }
                    }
                });

                return res.status(200).json({ message: 'Niveau mis à jour', user: updatedUser });
            default:
                return res.status(405).json({ message: 'Méthode non autorisée' });
        }
    } catch (err) {
        onError(err, res);
    }
}
