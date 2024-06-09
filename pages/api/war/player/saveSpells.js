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

// POST
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

        const { spells } = req.body;
        console.log(spells);
        if (!spells) {
            return res.status(400).json({ message: 'Spells non fournis' });
        }

        if (spells.length > 5) {
            return res.status(400).json({ message: 'Vous ne pouvez pas avoir plus de 5 sorts passif' });
        }

        const player = await prisma.warPlayers.findUnique({
            where: {
                petId: decoded.id
            }
        });

        if (!player) {
            return res.status(404).json({ message: 'Joueur non trouvé' });
        }

        await runMiddleware(req, res, corsMiddleware);

        switch (req.method) {
            case 'POST':
                // Rechercher tous les sorts passifs du joueur
                const existingPassifSpells = await prisma.warPlayerSkills.findMany({
                    where: {
                        petId: decoded.id,
                    },
                    include: {
                        warSkills: true
                    }
                });

                // Filtrer pour obtenir uniquement les sorts passifs sélectionnés
                const selectedPassifSpells = existingPassifSpells.filter(skill => skill.warSkills.type === 'passif' && skill.isSelected === true);
                // Filtrer pour obtenir uniquement les sorts passifs non sélectionnés
                const unselectedPassifSpells = existingPassifSpells.filter(skill => skill.warSkills.type === 'passif' && skill.isSelected === false);
                // Extraire les IDs des sorts passifs sélectionnés existants
                const selectedPassifSkillIds = selectedPassifSpells.map(skill => skill.skillId);
                // Extraires les IDs des sorts passifs non sélectionnés existants
                const unselectedPassifSkillIds = unselectedPassifSpells.map(skill => skill.skillId);

                // Extraire les IDs des sorts passifs sélectionnés du call
                const selectedPassifSkillsIdCall = spells.map(skill => skill.skillId);

                // Filtrer les sorts à désélectionner et ceux à sélectionner
                const skillsToDeselect = selectedPassifSkillIds.filter(skillId => !selectedPassifSkillsIdCall.includes(skillId));
                const skillsToSelect = unselectedPassifSkillIds.filter(skillId => selectedPassifSkillsIdCall.includes(skillId));

                // Utiliser une transaction pour garantir que les opérations sont atomiques
                await prisma.$transaction([
                    prisma.warPlayerSkills.updateMany({
                        where: {
                            petId: decoded.id,
                            skillId: {
                                in: skillsToDeselect
                            }
                        },
                        data: {
                            isSelected: false
                        }
                    }),
                    prisma.warPlayerSkills.updateMany({
                        where: {
                            petId: decoded.id,
                            skillId: {
                                in: skillsToSelect
                            }
                        },
                        data: {
                            isSelected: true
                        }
                    })
                ]);

                // Reprendre les infos du joueur avec les skills modifiés
                const updatedPlayerSkills = await prisma.warPlayers.findUnique({
                    where: { petId: decoded.id },
                    include: {
                        map: true,
                        warPlayerSkills: {
                            include: { warSkills: true }
                        }
                    }
                });

                res.status(200).json({ updatedPlayerSkills });
                break
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) { onError(err, res) }
    finally { await prisma.$disconnect() }
}