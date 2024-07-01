import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import { getToken } from "next-auth/jwt";
import { calculateDistance, calculatePassiveSpellsStats, finalStats, calculateHit, calculateEvade, calculateDamage, calculateDamageCrit, getTilesandCoordinates } from '../../fight';

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
                    petId_skillId: {
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

            if (playerFinalStats.hp <= 0) {
                return res.status(400).json({ message: 'Vous êtes mort' });
            }

            if (opponentFinalStats.hp <= 0) {
                return res.status(400).json({ message: 'Votre adversaire est déjà mort' });
            }

            const hit = calculateHit(playerFinalStats, skill.warSkills);
            // Si le joueur loupe son attaque/sort
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
                await addMessages(decoded.id, randomMissMessage);
                const opponentMissMessage = skill.warSkills.stat === 'str' ? [
                    `${player.name} a manqué son attaque sur vous`,
                    `Le coup de ${player.name} vous a raté`,
                    `L'attaque de ${player.name} envers vous a échoué`] : [
                    `Le sort de ${player.name} n'a vous a pas touché`,
                    `Le sort de ${player.name} vous a manqué`,
                    `Le sort vous ciblant de ${player.name} a échoué`]
                const randomOpponentMissMessage = opponentMissMessage[Math.floor(Math.random() * opponentMissMessage.length)];
                await addMessages(opponentId, randomOpponentMissMessage);
                // Mettre à jour le joueur
                const updatedPlayer = await prisma.warPlayers.update({
                    where: {
                        petId: decoded.id
                    },
                    data: {
                        pa: {
                            decrement: skill.warSkills.cost
                        }
                    },
                    include: {
                        map: true,
                        warPlayerSkills: {
                            include: { warSkills: true }
                        },
                        warMessages: {
                            orderBy: { createdAt: "desc" }
                        },
                        warPlayerItems: {
                            include: { warItems: true }
                        }
                    }
                });

                // Mettre à jour les tuiles et coordonnées
                const { tiles, allCoordinates } = await getTilesandCoordinates(updatedPlayer.map);

                return res.status(200).json({ message: randomMissMessage, updatedPlayer, tiles, allCoordinates, type: 'error'  });
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
                await addMessages(decoded.id, randomEvadeMessage);
                const opponentEvadeMessage = skill.warSkills.stat === 'str' ? [
                    `Vous avez esquivé l'attaque de ${player.name}`,
                    `Le coup de ${player.name} a été évité`,
                    `L'attaque de ${player.name} a été esquivée`] : [
                    `Vous avez bloqué le sort de ${player.name}`,
                    `Le sort de ${player.name} a été stoppé`,
                    `Le sort de ${player.name} a été bloqué`]
                const randomOpponentEvadeMessage = opponentEvadeMessage[Math.floor(Math.random() * opponentEvadeMessage.length)];
                await addMessages(opponentId, randomOpponentEvadeMessage);
                // Mettre à jour le joueur
                const updatedPlayer = await prisma.warPlayers.update({
                    where: {
                        petId: decoded.id
                    },
                    data: {
                        pa: {
                            decrement: skill.warSkills.cost
                        }
                    },
                    include: {
                        map: true,
                        warPlayerSkills: {
                            include: { warSkills: true }
                        },
                        warMessages: {
                            orderBy: { createdAt: "desc" }
                        },
                        warPlayerItems: {
                            include: { warItems: true }
                        }
                    }
                });

                // Mettre à jour les tuiles et coordonnées
                const { tiles, allCoordinates } = await getTilesandCoordinates(updatedPlayer.map);

                return res.status(200).json({ message: randomEvadeMessage, updatedPlayer, tiles, allCoordinates, type: 'error' });
            }

            const crit = Math.random() * 100 <= playerFinalStats.crit;

            let xpPlayer = player.xp;
            let damage = 0;
            let hpFinal = opponentFinalStats.hp;
            let hpReal = opponent.hp;
            let isPlayerDied = null;
            let xpWin = 0;
            let message = '';

            if (crit) {
                damage = calculateDamageCrit(playerFinalStats, skill.warSkills, opponentFinalStats);

                hpFinal -= damage;
                if (hpFinal <= 0) {
                    xpPlayer += opponent.level +1;
                    xpWin += opponent.level + 1;
                    isPlayerDied = new Date(new Date().getTime() + player.level * 60 * 60 * 1000); // Date actuelle + 1 heure par niveau
                }
                xpPlayer += 2;
                xpWin += 2;
                let critMessage = [];
                if (hpFinal <= 0) {
                    critMessage = skill.warSkills.stat === 'str' ? [
                        `Vous avez infligé un coup critique de ${damage} dommages à ${opponent.name} qui a succombé à votre attaque, vous gagnez ${xpWin} XP`,
                        `Vous avez vaincu ${opponent.name} avec un coup critique de ${damage} points de dégats, vous obtenez ${xpWin} XP`,
                        `Votre coup critique de ${damage} dommages a été fatal à ${opponent.name}, vous gagnez ${xpWin} XP`
                    ] : [
                        `Vous avez lancé un sort critique de ${damage} points de dégats à ${opponent.name} qui a succombé à votre attaque, vous gagnez ${xpWin} XP`,
                        `Vous avez vaincu ${opponent.name} avec un sort critique de ${damage} points de dégats, vous obtenez ${xpWin} XP`,
                        `Votre sort critique de ${damage} a été fatal à ${opponent.name}, vous gagnez ${xpWin} XP`
                    ]
                } else {
                critMessage = skill.warSkills.stat === 'str' ? [
                    `Vous avez infligé un coup critique de ${damage} dommages à ${opponent.name}, vous gagnez ${xpWin} XP`,
                    `Votre coup critique de ${damage} points de dégats a touché ${opponent.name}, vous obtenez ${xpWin} XP`,
                    `Votre coup critique de ${damage} dommage a été porté à ${opponent.name}, vous gagnez ${xpWin} XP`
                ] : [
                    `Vous avez lancé un sort critique de ${damage} points de dégats à ${opponent.name}, vous gagnez ${xpWin} XP`,
                    `Votre sort critique de ${damage} dommages a touché ${opponent.name}, vous obtenez ${xpWin} XP`,
                    `Votre sort critique de ${damage} a été lancé sur ${opponent.name}, vous gagnez ${xpWin} XP`
                ]
            }
                const randomCritMessage = critMessage[Math.floor(Math.random() * critMessage.length)];
                await addMessages(decoded.id, randomCritMessage);

                let opponentCritMessage = [];

                if (hpFinal <= 0) {
                    opponentCritMessage = skill.warSkills.stat === 'str' ? [
                        `${player.name} vous a infligé un coup critique de ${damage} points de dégats qui vous a été fatal`,
                        `Vous n'avez pas survécu au coup critique de ${player.name} de ${damage} points de dégats`,
                        `Le coup critique de ${player.name} vous a infligé ${damage} points de dégats vous tuant sur le coup`
                    ] : [
                        `${player.name} vous a lancé un sort critique de ${damage} points de dégats qui vous a été fatal`,
                        `Vous n'avez pas survécu au sort critique de ${player.name} de ${damage} points de dégats`,
                        `Le sort critique de ${player.name} vous a infligé ${damage} points de dégats vous tuant sur le coup`
                    ]
                } else {
                opponentCritMessage = skill.warSkills.stat === 'str' ? [
                    `${player.name} vous a infligé un coup critique de ${damage} points de dégats`,
                    `Le coup critique de ${player.name} vous a touché de ${damage} points de dégats`,
                    `Le coup critique de ${player.name} vous a infligé ${damage} points de dégats`
                ] : [
                    `${player.name} vous a lancé un sort critique de ${damage} points de dégats`,
                    `Le sort critique de ${player.name} vous a touché de ${damage} points de dégats`,
                    `Le sort critique de ${player.name} vous a infligé ${damage} points de dégats`
                ]
            }
                const randomOpponentCritMessage = opponentCritMessage[Math.floor(Math.random() * opponentCritMessage.length)];
                await addMessages(opponentId, randomOpponentCritMessage);


            } else {
                damage = calculateDamage(playerFinalStats, skill.warSkills, opponentFinalStats);
                hpFinal -= damage;
                if (hpFinal <= 0) {
                    hpFinal = 0;
                    xpPlayer += opponent.level + 1;
                    xpWin += opponent.level + 1;
                    isPlayerDied = new Date(new Date().getTime() + player.level * 60 * 60 * 1000); // Date actuelle + 1 heure par niveau
                }
                xpPlayer += 2;
                xpWin += 2;

                let damageMessage = [];
                
                if (hpFinal <= 0) {
                    damageMessage = skill.warSkills.stat === 'str' ? [
                        `Vous avez infligé ${damage} dommages à ${opponent.name} qui a succombé à votre attaque, vous gagnez ${xpWin} XP`,
                        `Vous avez vaincu ${opponent.name} avec un coup de ${damage} points de dégats, vous obtenez ${xpWin} XP`,
                        `Votre coup de ${damage} dommages a été fatal à ${opponent.name}, vous gagnez ${xpWin} XP`
                    ] : [
                        `Vous avez lancé un sort de ${damage} points de dégats à ${opponent.name} qui a succombé à votre attaque, vous gagnez ${xpWin} XP`,
                        `Vous avez vaincu ${opponent.name} avec un sort de ${damage} points de dégats, vous obtenez ${xpWin} XP`,
                        `Votre sort de ${damage} a été fatal à ${opponent.name}, vous gagnez ${xpWin} XP`
                    ]
                } else {
                damageMessage = skill.warSkills.stat === 'str' ? [
                    `Vous avez infligé ${damage} dommages à ${opponent.name}, vous gagnez ${xpWin} XP`,
                    `Votre coup de ${damage} points de dégats a touché ${opponent.name}, vous obtenez ${xpWin} XP`,
                    `Le coup de ${damage} dommages a été porté à ${opponent.name}, vous gagnez ${xpWin} XP`
                ] : [
                    `Vous avez lancé un sort de ${damage} points de dégats à ${opponent.name}, vous gagnez ${xpWin} XP`,
                    `Votre sort de ${damage} dommages a touché ${opponent.name}, vous obtenez ${xpWin} XP`,
                    `Le sort de ${damage} dommages a été lancé à ${opponent.name}, vous gagnez ${xpWin} XP`
                ]
            }
                const randomDamageMessage = damageMessage[Math.floor(Math.random() * damageMessage.length)];
                await addMessages(decoded.id, randomDamageMessage);

                let opponentDamageMessage = [];

                if (hpFinal <= 0) {
                    opponentDamageMessage = skill.warSkills.stat === 'str' ? [
                        `${player.name} vous a infligé ${damage} points de dégats qui vous a été fatal`,
                        `Vous n'avez pas survécu au coup de ${player.name} de ${damage} points de dégats`,
                        `Le coup de ${player.name} vous a infligé ${damage} points de dégats vous tuant sur le coup`
                    ] : [
                        `${player.name} vous a lancé un sort de ${damage} points de dégats qui vous a été fatal`,
                        `Vous n'avez pas survécu au sort de ${player.name} de ${damage} points de dégats`,
                        `Le sort de ${player.name} vous a infligé ${damage} points de dégats vous tuant sur le coup`
                    ]
                } else {
                opponentDamageMessage = skill.warSkills.stat === 'str' ? [
                    `${player.name} vous a infligé ${damage} points de dégats`,
                    `Le coup de ${player.name} vous a touché de ${damage} points de dégats`,
                    `Le coup de ${player.name} vous a infligé ${damage} points de dégats`
                ] : [
                    `${player.name} vous a lancé un sort de ${damage} points de dégats`,
                    `Le sort de ${player.name} vous a touché de ${damage} points de dégats`,
                    `Le sort de ${player.name} vous a infligé ${damage} points de dégats`
                ]
            }
                const randomOpponentDamageMessage = opponentDamageMessage[Math.floor(Math.random() * opponentDamageMessage.length)];
                await addMessages(opponentId, randomOpponentDamageMessage);

                // Mettre à jour les joueurs
                const updatedOpponent = await prisma.warPlayers.update({
                    where: {
                        petId: opponentId
                    },
                    data: {
                        hp: {
                            decrement: damage
                        },
                        isDied: isPlayerDied
                    }
                });

                const updatedPlayer = await prisma.warPlayers.update({
                    where: {
                        petId: decoded.id
                    },
                    data: {
                        xp: xpPlayer,
                        pa: {
                            decrement: skill.warSkills.cost
                        }
                    },
                    include: {
                        map: true,
                        warPlayerSkills: {
                            include: { warSkills: true }
                        },
                        warMessages: {
                            orderBy: { createdAt: "desc" }
                        },
                        warPlayerItems: {
                            include: { warItems: true }
                        }
                    }
                });

                // Mettre à jour les tuiles et coordonnées
                const { tiles, allCoordinates } = await getTilesandCoordinates(updatedPlayer.map);

                return res.status(200).json({ message: randomDamageMessage, updatedPlayer, updatedOpponent, tiles, allCoordinates, type: 'success' });

            }

            return res.status(200).json(player);
        } else {
            return res.status(405).json({ message: 'Méthode non autorisée' });
        }
    } catch (err) {
        onError(err, res);
    }
}