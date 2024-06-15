import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import { getToken } from "next-auth/jwt";
import { calculateDistance, calculatePassiveSpellsStats, finalStats, calculateHit, calculateEvade, calculateDamage, calculateDamageCrit } from '../../fight';

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

// Fonction pour ajouter une notification
async function addMessages(playerId, message) {
    await prisma.warMessages.create({
        data: {
            petId: playerId,
            message: message
        },
    });
}

// POST /api/war/player
export default async function handler(req, res) {
    await runMiddleware(req, res, corsMiddleware);

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

        if (req.method === 'POST') {
            const { opponentId, spellId } = req.body;

            if (!opponentId || !spellId) {
                return res.status(400).json({ message: 'Paramètres manquants' });
            }

            const player = await prisma.warPlayers.findUnique({
                where: {
                    petId: decoded.id
                },
                include: {
                    map: true,
                    warPlayerSkills: {
                        include: {
                            warSkills: true
                        }
                    }
                }
            });

            if (!player) {
                return res.status(404).json({ message: 'Joueur non trouvé' });
            }

            const opponent = await prisma.warPlayers.findUnique({
                where: {
                    petId: opponentId
                },
                include: {
                    map: true,
                    warPlayerSkills: {
                        include: {
                            warSkills: true
                        }
                    }
                }
            });

            if (!opponent) {
                return res.status(404).json({ message: 'Adversaire non trouvé' });
            }

            const skill = await prisma.warPlayerSkills.findUnique({
                where: {
                    petId_skillId : {
                    petId: decoded.id,
                    skillId: spellId
                    }
                },
                include: {
                    warSkills: true
                }
            });   

            if (!skill) {
                return res.status(404).json({ message: 'Sort non trouvé' });
            }

            if (player.pa < skill.warSkills.cost) {
                return res.status(400).json({ message: 'Pas assez de PA pour lancer le sort' });
            }

            const distance = calculateDistance(player.map, opponent.map);
            
            if (distance > skill.warSkills.dist) {
                return res.status(400).json({ message: 'Cible hors de portée' });
            }
            
            const playerPassifSkillsStats = calculatePassiveSpellsStats(player.warPlayerSkills.filter(skill => skill.warSkills.type === 'passif' && skill.isSelected === true) || []);
            const opponentPassifSkillsStats = calculatePassiveSpellsStats(opponent.warPlayerSkills.filter(skill => skill.warSkills.type === 'passif' && skill.isSelected === true) || []);
            const playerFinalStats = finalStats(player, playerPassifSkillsStats);
            const opponentFinalStats = finalStats(opponent, opponentPassifSkillsStats);
            
            const hit = calculateHit(playerFinalStats, skill.warSkills);

            if (!hit) {
                // Choisir un message parmis une liste de messages aléatoires

                const missMessages = skill.warSkills.stat === 'str' ? [
                    `Vous avez manqué votre attaque sur ${opponent.name}`,
                    `Votre coup sur ${opponent.name} a raté`,
                    `L'attaque sur ${opponent.name} a échoué`,
                    `Votre tentative d'attaque sur ${opponent.name} a été un échec`
                ] : [
                    `Votre avez manqué votre sort sur ${opponent.name}`,
                    `Votre sort n'a pas touché ${opponent.name}`,
                    `Le sort a manqué ${opponent.name}`,
                    `Votre tentative de lancer de sort sur ${opponent.name} a échoué`
                ]
                const randomMissMessage = missMessages[Math.floor(Math.random() * missMessages.length)];
                return res.status(400).json({ message: randomMissMessage });
            }

            const evade = calculateEvade(opponentFinalStats, skill.warSkills.stat);
            if (evade) {
                // Choisir un message parmis une liste de messages aléatoires
                const evadeMessages = skill.warSkills.stat === 'str' ? [
                    `${opponent.name} a esquivé votre attaque`,
                    `L'attaque a été esquivée par ${opponent.name}`,
                    `Votre coup a été évité par ${opponent.name}`
                ] : [
                    `${opponent.name} a bloqué votre sort`,
                    `Le sort a été stoppé par ${opponent.name}`,
                    `Votre sort a été bloqué par ${opponent.name}`
                ]
                const randomEvadeMessage = evadeMessages[Math.floor(Math.random() * evadeMessages.length)];

                return res.status(400).json({ message: randomEvadeMessage });
            }

            const crit = Math.random() * 100 <= playerFinalStats.crit;

            let xp = player.xp;
            let damage = 0;
            let hp = opponent.hp;
            console.log("crit", crit);
            if (crit) {
                damage = calculateDamageCrit(playerFinalStats, skill.warSkills, opponentFinalStats);
                console.log("damage", damage);
                hp -= damage;
                if (hp <= 0) {
                    hp = 0;
                    xp += player.level + 10 + 1;  
                }

                
            } else {
                damage = calculateDamage(playerFinalStats, skill.warSkills, opponentFinalStats);
                hp -= damage;
                if (hp <= 0) {
                    hp = 0;
                    xp += player.level + 10 + 1;
                }
                addMessages(decoded.id, `Vous avez infligé ${damage} à ${opponent.name}`);
                
            }

            return res.status(200).json(player);
        } else {
            return res.status(405).json({ message: 'Méthode non autorisée' });
        }
    } catch (err) {
        onError(err, res);
    }
}