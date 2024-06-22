import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import { getToken } from "next-auth/jwt";
import { xpToNextLevel } from '../../fight';
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

// GET /api/war/player/level/choices
// Récupérer les choix de niveau pour un joueur
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

        const player = await prisma.pets.findUnique({
            where: { userId: decoded.id }
        });

        if (!player) {
            return res.status(404).json({ message: 'Joueur non trouvé' });
        }
    
        const user = await prisma.warPlayers.findUnique({
            where: {
                petId: decoded.id
            },
        });
        
        if (!user) {
            return res.status(404).json({ message: 'Joueur non trouvé' });
        }
        
        // Vérifier si le joueur est mort
        if (user.isDied) {
            return res.status(400).json({ message: 'Joueur mort' });
        }

        // Vérifier si le joueur peut bien levelUp
        xpToNextLevel(user.level)

        if (user.xp < xpToNextLevel(user.level)) {
            return res.status(400).json({ message: 'XP insuffisant pour monter de niveau' });
        } 

        if (user.levelChoices) {
            return res.status(400).json({ message: 'Vous avez déjà choisi vos niveaux' });
        }

        
        // Calculer les points disponibles
        const availablePoints = await calculatePoints(player);

        const cost = user.level * 10;
        
        if (availablePoints < cost) {
            return res.status(400).json({ message: 'Points insuffisants' });
        }

        // Mettre à jour les points du joueur
        await prisma.pets.update({
            where: { userId: decoded.id },
            data: { pointsUsed: { increment: cost } }
        });

        // Obtenir tout les choix de niveau
        const choices = await prisma.warLevelChoices.findMany({});

        // Tirer 3 choix de niveau aléatoirement
        const randomChoices = [];
        while (randomChoices.length < 3) {
            const randomIndex = Math.floor(Math.random() * choices.length);
            randomChoices.push(choices[randomIndex]);
            choices.splice(randomIndex, 1);
        }

        // Ajouter les choix aux joueur
        const userSpell = await prisma.warPlayers.update({
            where: { petId: decoded.id },
            data: { levelChoices: randomChoices }
        });

        return res.status(200).json({levelChoices: userSpell.levelChoices, totalPoints: availablePoints - cost});

    } catch (err) { onError(err, res) }
    finally { await prisma.$disconnect() }
}
