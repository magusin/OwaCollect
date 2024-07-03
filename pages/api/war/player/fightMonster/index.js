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

async function monsterAttack(player, monster) {
    const skill = monster.monsters.warMonsterSkills[Math.floor(Math.random() * monster.monsters.warMonsterSkills.length)];
    console.log('skill', skill)
    const hit = calculateHit(monster, skill.warSkills);
    if (!hit) {
        // tirer un message aléatoire
        const missMessages = skill.warSkills.stat === 'str' ? [
            `${monster.monsters.name} a manqué son attaque sur vous`,
            `Le coup de ${monster.monsters.name} vous a raté`,
            `L'attaque de ${monster.monsters.name} envers vous a échoué`] : [
            `Le sort de ${monster.monsters.name} vous a manqué`,
            `${monster.monsters.name} a manqué son sort sur vous`,
            `Le sort de ${monster.monsters.name} vous a raté`,
            `Le sort de ${monster.monsters.name} envers vous a échoué`]
        const monsterMessage = missMessages[Math.floor(Math.random() * missMessages.length)];
        addMessages(player.petId, monsterMessage);
        return { message: monsterMessage, damage: 0, isDied: null };
    }

    const evade = calculateEvade(player, skill.warSkills.stat);
    console.log('MonsterEvade')

    if (evade) {
        // Choisir un message parmis une liste de messages aléatoires
        const evadeMessages = skill.warSkills.stat === 'str' ? [
            `Vous avez esquivé l'attaque de ${monster.monsters.name}`,
            `Le coup de ${monster.monsters.name} a été évité`,
            `L'attaque de ${monster.monsters.name} a été esquivée`] : [
            `Vous avez bloqué le sort de ${monster.monsters.name}`,
            `Le sort de ${monster.monsters.name} a été stoppé`,
            `Le sort de ${monster.monsters.name} a été bloqué`]
        const monsterMessage = evadeMessages[Math.floor(Math.random() * evadeMessages.length)];
        await addMessages(player.petId, monsterMessage);
        return { message: monsterMessage, damage: 0, isDied: null };
    }

    const crit = Math.random() * 100 <= monster.crit;
    console.log('MonsterCrit')
    let hpPlayer = player.hp;
    let damage = 0;
    let isDied = null;
    let message = '';

    if (crit) {
        let critMessages = [];
        damage = calculateDamageCrit(monster, skill.warSkills, player);
        hpPlayer = player.hp - damage;
        if (hpPlayer <= 0) {
            hpPlayer = 0;
            isDied = new Date(new Date().getTime() + player.level * 60 * 60 * 1000);
            critMessages = skill.warSkills.stat === 'str' ? [
                `${monster.monsters.name} vous a tué avec un coup critique de ${damage} dommages avec ${skill.warSkills.name}`,
                `Vous avez subi un coup critique de ${damage} points de dégats de ${monster.monsters.name} avec ${skill.warSkills.name} qui vous a terrassé`,
                `Le coup critique ${skill.warSkills.name} de ${monster.monsters.name} vous a tué en infligeant ${damage} points de dégats`] : [
                `${monster.monsters.name} vous a abattu avec le sort critique ${skill.warSkills.name} de ${damage} points de dégats`,
                `Vous avez péri avec le sort critique ${skill.warSkills.name} de ${damage} points de dégats de ${monster.monsters.name}`,
                `Le sort critique ${skill.warSkills.name} de ${monster.monsters.name} vous a tué infligeant ${damage} points de dégats`]
        } else {
            critMessages = skill.warSkills.stat === 'str' ? [
                `${monster.monsters.name} vous a infligé un coup critique de ${damage} dommages avec ${skill.warSkills.name}`,
                `Vous avez subi un coup critique de ${damage} points de dégats de ${monster.monsters.name} avec ${skill.warSkills.name}`,
                `Le coup critique ${skill.warSkills.name} de ${monster.monsters.name} vous a infligé ${damage} points de dégats`] : [
                `${monster.monsters.name} vous a touché avec le sort critique ${skill.warSkills.name} de ${damage} points de dégats`,
                `Vous avez subi le sort critique ${skill.warSkills.name} de ${damage} points de dégats de ${monster.monsters.name}`,
                `Le sort critique ${skill.warSkills.name} de ${monster.monsters.name} vous a infligé ${damage} points de dégats`]
        }
        const monsterMessage = critMessages[Math.floor(Math.random() * critMessages.length)];
        await addMessages(player.petId, monsterMessage);
        message += monsterMessage;
    } else {
        console.log('MonsterDamage')
        let damageMessages = [];
        damage = calculateDamage(monster, skill.warSkills, player);
        hpPlayer = player.hp - damage;
        if (hpPlayer <= 0) {
            hpPlayer = 0;
            isDied = new Date(new Date().getTime() + player.level * 60 * 60 * 1000);
            damageMessages = skill.warSkills.stat === 'str' ? [
                `${monster.monsters.name} vous a tué avec ${damage} dommages avec ${skill.warSkills.name}`,
                `Vous avez subi un coup de ${damage} points de dégats de ${monster.monsters.name} avec ${skill.warSkills.name} qui vous a terrassé`,
                `Le coup ${skill.warSkills.name} de ${monster.monsters.name} vous a tué en infligeant ${damage} points de dégats`] : [
                `${monster.monsters.name} vous a abattu avec le sort ${skill.warSkills.name} de ${damage} points de dégats`,
                `Vous avez péri avec le sort ${skill.warSkills.name} de ${damage} points de dégats de ${monster.monsters.name}`,
                `Le sort ${skill.warSkills.name} de ${monster.monsters.name} vous a tué infligeant ${damage} points de dégats`]
        }
        damageMessages = skill.warSkills.stat === 'str' ? [
            `${monster.monsters.name} vous a infligé ${damage} dommages avec ${skill.warSkills.name}`,
            `Vous avez subi un coup de ${damage} points de dégats de ${monster.monsters.name} avec ${skill.warSkills.name}`,
            `Le coup ${skill.warSkills.name} de ${monster.monsters.name} vous a infligé ${damage} points de dégats`] : [
            `${monster.monsters.name} vous a touché avec le sort ${skill.warSkills.name} de ${damage} points de dégats`,
            `Vous avez subi le sort ${skill.warSkills.name} de ${damage} points de dégats de ${monster.monsters.name}`,
            `Le sort ${skill.warSkills.name} de ${monster.monsters.name} vous a infligé ${damage} points de dégats`]
        const monsterMessage = damageMessages[Math.floor(Math.random() * damageMessages.length)];
        addMessages(player.petId, monsterMessage);
        message += monsterMessage;
    }
    return { message: message, damage: damage, isDied: isDied };
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
            const { monsterId, spellId } = req.body;

            if (!monsterId || !spellId) {
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
                    },
                    warPlayerItems: {
                        include: {
                            warItems: true
                        }
                    }
                }
            });

            if (!player) {
                return res.status(404).json({ message: 'Joueur non trouvé' });
            }

            const opponent = await prisma.warMonsters.findUnique({
                where: {
                    id: monsterId
                },
                include: {
                    map: true,
                    monsters: {
                        include: {
                            warMonsterSkills: { include: { warSkills: true } },
                            warMonsterLoots: { include: { warItems: true } }
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
            // const opponentPassifSkillsStats = calculatePassiveSpellsStats(opponent.warPlayerSkills.filter(skill => skill.warSkills.type === 'passif' && skill.isSelected === true) || []);
            const playerFinalStats = finalStats(player, playerPassifSkillsStats);
            // const opponentFinalStats = finalStats(opponent, opponentPassifSkillsStats);

            if (playerFinalStats.hp <= 0) {
                return res.status(400).json({ message: 'Vous êtes mort' });
            }

            if (opponent.hp <= 0) {
                return res.status(400).json({ message: 'Votre adversaire est déjà mort' });
            }

            const hit = calculateHit(playerFinalStats, skill.warSkills);
            // Si le joueur loupe son attaque/sort
            if (!hit) {
                // Choisir un message parmis une liste de messages aléatoires
                console.log('Miss')
                const missMessages = skill.warSkills.stat === 'str' ? [
                    `Vous avez manqué votre attaque sur ${opponent.monsters.name}`,
                    `Votre coup sur ${opponent.monsters.name} a raté`,
                    `L'attaque sur ${opponent.monsters.name} a échoué`,
                    `Votre tentative d'attaque sur ${opponent.monsters.name} a été un échec`
                ] : [
                    `Votre avez manqué votre sort sur ${opponent.monsters.name}`,
                    `Votre sort n'a pas touché ${opponent.monsters.name}`,
                    `Le sort a manqué ${opponent.monsters.name}`,
                    `Votre tentative de lancer de sort sur ${opponent.monsters.name} a échoué`
                ]
                const randomMissMessage = missMessages[Math.floor(Math.random() * missMessages.length)];
                await addMessages(decoded.id, randomMissMessage);

                const monsterResponse = await monsterAttack(playerFinalStats, opponent);


                // Mettre à jour le joueur
                const updatedPlayer = await prisma.warPlayers.update({
                    where: {
                        petId: decoded.id
                    },
                    data: {
                        pa: {
                            decrement: skill.warSkills.cost
                        },
                        hp: {
                            decrement: monsterResponse.damage
                        },
                        isDied: monsterResponse.isDied
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
                            include: {
                                warItems: true
                            }
                        }
                    }
                });

                // Mettre à jour les tuiles et coordonnées
                const { tiles, allCoordinates } = await getTilesandCoordinates(updatedPlayer.map);

                return res.status(200).json({ message: randomMissMessage + `\n${monsterResponse.message}`, updatedPlayer, tiles, allCoordinates, type: 'error' });
            }

            const evade = calculateEvade(opponent, skill.warSkills.stat);
            console.log('Evade')
            if (evade) {
                // Choisir un message parmis une liste de messages aléatoires
                const evadeMessages = skill.warSkills.stat === 'str' ? [
                    `${opponent.monsters.name} a esquivé votre attaque`,
                    `L'attaque a été esquivée par ${opponent.monsters.name}`,
                    `Votre coup a été évité par ${opponent.monsters.name}`
                ] : [
                    `${opponent.monsters.name} a bloqué votre sort`,
                    `Le sort a été stoppé par ${opponent.monsters.name}`,
                    `Votre sort a été bloqué par ${opponent.monsters.name}`
                ]
                const randomEvadeMessage = evadeMessages[Math.floor(Math.random() * evadeMessages.length)];
                await addMessages(decoded.id, randomEvadeMessage);

                const monsterResponse = await monsterAttack(playerFinalStats, opponent);

                // Mettre à jour le joueur
                const updatedPlayer = await prisma.warPlayers.update({
                    where: {
                        petId: decoded.id
                    },
                    data: {
                        pa: {
                            decrement: skill.warSkills.cost
                        },
                        hp: {
                            decrement: monsterResponse.damage
                        },
                        isDied: monsterResponse.isDied
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
                            include: {
                                warItems: true
                            }
                        }
                    }
                });

                // Mettre à jour les tuiles et coordonnées
                const { tiles, allCoordinates } = await getTilesandCoordinates(updatedPlayer.map);

                return res.status(200).json({ message: randomEvadeMessage + `\n${monsterResponse.message}`, updatedPlayer, tiles, allCoordinates, type: 'error' });
            }

            const crit = Math.random() * 100 <= playerFinalStats.crit;

            let xpPlayer = player.xp;
            let damage = 0;
            let hpMonster = opponent.hp;
            let isMonsterDied = false;
            let xpWin = 0;
            let message = '';

            if (crit) {
                console.log('Crit')
                let critMessage = [];
                damage = calculateDamageCrit(playerFinalStats, skill.warSkills, opponent);
                xpPlayer += 2;
                xpWin += 2;
                hpMonster -= damage;
                if (hpMonster <= 0) {
                    xpPlayer += opponent.level + 1;
                    xpWin += opponent.level + 1;
                    isMonsterDied = true;
                    critMessage = skill.warSkills.stat === 'str' ? [
                        `Vous avez infligé un coup critique de ${damage} dommages à ${opponent.monsters.name} qui a succombé à votre attaque, vous gagnez ${xpWin} XP`,
                        `Vous avez vaincu ${opponent.monsters.name} avec un coup critique de ${damage} points de dégats, vous obtenez ${xpWin} XP`,
                        `Votre coup critique de ${damage} dommages a été fatal à ${opponent.monsters.name}, vous gagnez ${xpWin} XP`
                    ] : [
                        `Vous avez lancé un sort critique de ${damage} points de dégats à ${opponent.monsters.name} qui a succombé à votre attaque, vous gagnez ${xpWin} XP`,
                        `Vous avez vaincu ${opponent.monsters.name} avec un sort critique de ${damage} points de dégats, vous obtenez ${xpWin} XP`,
                        `Votre sort critique de ${damage} a été fatal à ${opponent.monsters.name}, vous gagnez ${xpWin} XP`
                    ]
                } else {
                    critMessage = skill.warSkills.stat === 'str' ? [
                        `Vous avez infligé un coup critique de ${damage} dommages à ${opponent.monsters.name}, vous gagnez ${xpWin} XP`,
                        `Votre coup critique de ${damage} points de dégats a touché ${opponent.monsters.name}, vous obtenez ${xpWin} XP`,
                        `Votre coup critique de ${damage} dommage a été porté à ${opponent.monsters.name}, vous gagnez ${xpWin} XP`
                    ] : [
                        `Vous avez lancé un sort critique de ${damage} points de dégats à ${opponent.monsters.name}, vous gagnez ${xpWin} XP`,
                        `Votre sort critique de ${damage} dommages a touché ${opponent.monsters.name}, vous obtenez ${xpWin} XP`,
                        `Votre sort critique de ${damage} a été lancé sur ${opponent.monsters.name}, vous gagnez ${xpWin} XP`
                    ]
                }
                const randomCritMessage = critMessage[Math.floor(Math.random() * critMessage.length)];
                await addMessages(decoded.id, randomCritMessage);
                message += randomCritMessage;
            } else {
                console.log('Damage')
                damage = calculateDamage(playerFinalStats, skill.warSkills, opponent);
                hpMonster -= damage;
                xpPlayer += 2;
                xpWin += 2;

                let damageMessage = [];
                if (hpMonster <= 0) {
                    hpMonster = 0;
                    xpPlayer += opponent.level + 1;
                    xpWin += opponent.level + 1;
                    isMonsterDied = true;
                    damageMessage = skill.warSkills.stat === 'str' ? [
                        `Vous avez infligé ${damage} dommages à ${opponent.monsters.name} qui a succombé à votre attaque, vous gagnez ${xpWin} XP`,
                        `Vous avez vaincu ${opponent.monsters.name} avec un coup de ${damage} points de dégats, vous obtenez ${xpWin} XP`,
                        `Votre coup de ${damage} dommages a été fatal à ${opponent.monsters.name}, vous gagnez ${xpWin} XP`
                    ] : [
                        `Vous avez lancé un sort de ${damage} points de dégats à ${opponent.monsters.name} qui a succombé à votre attaque, vous gagnez ${xpWin} XP`,
                        `Vous avez vaincu ${opponent.monsters.name} avec un sort de ${damage} points de dégats, vous obtenez ${xpWin} XP`,
                        `Votre sort de ${damage} a été fatal à ${opponent.monsters.name}, vous gagnez ${xpWin} XP`
                    ]
                } else {
                    damageMessage = skill.warSkills.stat === 'str' ? [
                        `Vous avez infligé ${damage} dommages à ${opponent.monsters.name}, vous gagnez ${xpWin} XP`,
                        `Votre coup de ${damage} points de dégats a touché ${opponent.monsters.name}, vous obtenez ${xpWin} XP`,
                        `Le coup de ${damage} dommages a été porté à ${opponent.monsters.name}, vous gagnez ${xpWin} XP`
                    ] : [
                        `Vous avez lancé un sort de ${damage} points de dégats à ${opponent.monsters.name}, vous gagnez ${xpWin} XP`,
                        `Votre sort de ${damage} dommages a touché ${opponent.monsters.name}, vous obtenez ${xpWin} XP`,
                        `Le sort de ${damage} dommages a été lancé à ${opponent.monsters.name}, vous gagnez ${xpWin} XP`
                    ]
                }

                const randomDamageMessage = damageMessage[Math.floor(Math.random() * damageMessage.length)];
                await addMessages(decoded.id, randomDamageMessage);
                message += randomDamageMessage;
                console.log('DamageMessage', randomDamageMessage)
            }

            if (isMonsterDied) {
                // Ajouter les loots
                const loots = opponent.monsters.warMonsterLoots;
                const lootCount = opponent.monsters.lootCount;

                // Tirer les loots
                const lootsWon = [];
                const playerSpells = player.warPlayerSkills.map(skill => skill.skillId);
                const playerItems = player.warPlayerItems.map(item => ({
                    itemId: item.itemId,
                    count: item.count
                }));
                // Exclure les sorts déjà possédés par le joueur des loots disponibles
                const filteredLoots = loots.filter(loot => !loot.skillId || !playerSpells.includes(loot.skillId));

                // Recalculer la valeur totale des loots après filtrage
                let totalLootsValue = filteredLoots.reduce((acc, loot) => acc + loot.value, 0);

                for (let i = 0; i < lootCount; i++) {
                    const random = Math.floor(Math.random() * totalLootsValue);
                    let count = 0;
                    for (let j = 0; j < loots.length; j++) {
                        count += loots[j].value;
                        if (random < count) {
                            const loot = loots[j];

                            if (loot.skillId && playerSpells.includes(loot.skillId)) {
                                // Le joueur possède déjà ce sort, on l'exclut
                                continue;
                            }

                            const existingLootIndex = lootsWon.findIndex(
                                (existingLoot) => existingLoot.itemId === loot.itemId && existingLoot.skillId === loot.skillId
                            );

                            if (existingLootIndex > -1) {
                                lootsWon[existingLootIndex].count += 1;
                            } else {
                                lootsWon.push({ ...loot, count: 1 });
                            }
                            break;
                        }
                    }
                }

                // Ajouter les loots au joueur
                for (const loot of lootsWon) {
                    if (loot.skillId) {
                        // Ajouter le sort au joueur
                        await prisma.warPlayerSkills.create({
                            data: {
                                petId: player.petId,
                                skillId: loot.skillId
                            }
                        });
                    } else if (loot.itemId) {
                        const existingPlayerItem = playerItems.find(item => item.itemId === loot.itemId);
                        if (existingPlayerItem) {
                            // Incrémenter le count de l'objet existant
                            await prisma.warPlayerItems.update({
                                where: {
                                    petId_itemId: {
                                        petId: player.petId,
                                        itemId: loot.itemId
                                    }
                                },
                                data: {
                                    count: existingPlayerItem.count + loot.count
                                }
                            });
                        } else {
                            // Ajouter le nouvel objet au joueur
                            await prisma.warPlayerItems.create({
                                data: {
                                    petId: player.petId,
                                    itemId: loot.itemId,
                                    count: loot.count
                                }
                            });
                        }
                    }
                }

                // Générer un message avec loot
                const lootMessage = lootsWon.map(loot => {
                    if (loot.skillId) {
                        console.log('loot', loot)
                        return `Vous avez obtenu le sort ${loot.warSkills.name}`;
                    } else if (loot.itemId) {
                        return `Vous avez obtenu ${loot.count} ${loot.warItems.name}`;
                    }
                }).join('\n');
                addMessages(decoded.id, lootMessage);
                message += `\n${lootMessage}`;

                // Supprimer le monstre
                await prisma.warMonsters.delete({
                    where: {
                        id: monsterId
                    }
                });
                // Mettre à jour le joueur
                const updatedPlayer = await prisma.warPlayers.update({
                    where: {
                        petId: decoded.id
                    },
                    data: {
                        xp: {
                            increment: xpWin
                        },
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
                            include: {
                                warItems: true
                            }
                        }
                    }
                });

                return res.status(200).json({ message: message, updatedPlayer, type: 'success' });
            } else {
                // Tour du monstre
                const monsterResponse = await monsterAttack(playerFinalStats, opponent);

                // Mettre à jour le joueur
                const updatedPlayer = await prisma.warPlayers.update({
                    where: {
                        petId: decoded.id
                    },
                    data: {
                        xp: {
                            increment: xpWin
                        },
                        pa: {
                            decrement: skill.warSkills.cost
                        },
                        hp: {
                            decrement: monsterResponse.damage
                        },
                        isDied: monsterResponse.isDied
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
                            include: {
                                warItems: true
                            }
                        }
                    }
                });

                // Mettre à jour le monstre
                await prisma.warMonsters.update({
                    where: {
                        id: monsterId
                    },
                    data: {
                        hp: {
                            decrement: damage
                        },
                    }
                });

                // Mettre à jour les tuiles et coordonnées
                const { tiles, allCoordinates } = await getTilesandCoordinates(updatedPlayer.map);

                return res.status(200).json({ message: message + `\n${monsterResponse.message}`, updatedPlayer, tiles, allCoordinates, type: 'success' });
            }
        } else {
            return res.status(405).json({ message: 'Méthode non autorisée' });
        }
    } catch (err) {
        onError(err, res);
    }
}