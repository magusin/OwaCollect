import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import { getToken } from "next-auth/jwt";

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

// POST /api/war/player/item
export default async function handler(req, res) {
    try {
        await runMiddleware(req, res, corsMiddleware);

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
            const { itemId, count } = req.body;

            if (!itemId || !count || isNaN(count) || count < 1) {
                return res.status(400).json({ message: 'Requête invalide' });
            }

            // Récupérer le joueur
            const player = await prisma.warPlayers.findUnique({
                where: {
                    petId: decoded.id
                },
                include: {
                    warPlayerItems: {
                        include: {
                            warItems: true
                        }
                    }
                }
            });

            if (!player) {
                return res.status(404).json({ message: 'Joueur introuvable' });
            }

            // Vérifier que le joueur possède l'objet
            const item = player.warPlayerItems.find(item => item.itemId === itemId);

            if (!item || item.warItems.id === 1 || (item.warItems.id != 12 && count > 10)) {
                return res.status(404).json({ message: 'Objet introuvable' });
            }

            // Vérifier que le joueur possède assez d'objets
            const finalCount = item.count - count;

            if (finalCount < 0) {
                return res.status(400).json({ message: 'Quantité insuffisante' });
            }

            if (item.warItems.card) {
                let rarety = '';
                if (item.warItems.id === 9) {
                    rarety = 'Commune';
                } else if (item.warItems.id === 10) {
                    rarety = 'Rare';
                } else if (item.warItems.id === 11) {
                    rarety = 'Epique';
                }

                let card = [];
                for (let i = 0; i < count; i++) {
                    const eligibleCards = await prisma.card.findMany({
                        where: {
                            AND: [
                                { rarety: rarety },
                                { isDraw: true }
                            ]
                        }
                    });

                    const randomIndex = Math.floor(Math.random() * eligibleCards.length);
                    card.push(eligibleCards[randomIndex]);
                }

                for (let i = 0; i < card.length; i++) {

                    const existingCard = await prisma.playercards.findFirst({
                        where: {
                            petId: decoded.id,
                            cardId: card[i].id
                        }
                    });

                    if (existingCard) {
                        await prisma.playercards.update({
                            where: {
                                petId_cardId: {
                                    petId: decoded.id,
                                    cardId: card[i].id
                                }
                            },
                            data: {
                                count: {
                                    increment: 1
                                }
                            }
                        });
                    } else {
                        await prisma.playercards.create({
                            data: {
                                petId: decoded.id,
                                cardId: card[i].id,
                                count: 1,
                                isNew: true
                            }
                        });
                    }
                }

                // Mettre à jour la quantité de l'objet
                if (finalCount === 0) {
                    await prisma.warPlayerItems.delete({
                        where: {
                            petId_itemId: {
                                petId: decoded.id,
                                itemId: itemId
                            }
                        }
                    });
                } else {
                    await prisma.warPlayerItems.update({
                        where: {
                            petId_itemId: {
                                petId: decoded.id,
                                itemId: itemId
                            }
                        },
                        data: {
                            count: finalCount
                        }
                    });
                }

                // Récupérer les datas du joueur
                const updatedUser = await prisma.warPlayers.findUnique({
                    where: {
                        petId: decoded.id
                    },
                    include: {
                        map: true,
                        warPlayerItems: {
                            include: {
                                warItems: true
                            }
                        }
                    }
                });
                return res.status(200).json({ message: `Vous avez obtenu ${count} carte ${rarety}`, updatedUser });
            } else if (item.warItems.point) {
                console.log('here')
                const pointsWin = item.warItems.point * count;

                await prisma.pets.update({
                    where: {
                        userId: decoded.id
                    },
                    data: {
                        pointsUsed: {
                            decrement: pointsWin
                        }
                    }
                });

                // Mettre à jour la quantité de l'objet
                if (finalCount === 0) {
                    await prisma.warPlayerItems.delete({
                        where: {
                            petId_itemId: {
                                petId: decoded.id,
                                itemId: itemId
                            }
                        }
                    });
                } else {
                    await prisma.warPlayerItems.update({
                        where: {
                            petId_itemId: {
                            petId: decoded.id,
                            itemId: itemId
                            }
                        },
                        data: {
                            count: finalCount
                        }
                    });
                }

                // Récupérer les datas du joueur
                const updatedUser = await prisma.warPlayers.findUnique({
                    where: {
                        petId: decoded.id
                    },
                    include: {
                        map: true,
                        warPlayerItems: {
                            include: {
                                warItems: true
                            }
                        }
                    }
                });

                return res.status(200).json({ message: `Objet utilisé vous avez gagné ${pointsWin} OC`, pointsWin, updatedUser });
            } else {
                // Monter les stats du joueur en rapport avec l'objet
                const upHp = item.warItems.hp * count;
                const upPa = item.warItems.pa * count;
                const finalHp = Math.min(player.hp + upHp, player.hpMax);
                const finalPa = Math.min(player.pa + upPa, player.paMax);

                // Mettre à jour la quantité de l'objet
                if (finalCount === 0) {
                    await prisma.warPlayerItems.delete({
                        where: {
                            petId_itemId: {
                                petId: decoded.id,
                                itemId: itemId
                            }
                        }
                    });
                } else {
                    await prisma.warPlayerItems.update({
                        where: {
                            petId_itemId: {
                                petId: decoded.id,
                                itemId: itemId
                            }
                        },
                        data: {
                            count: finalCount
                        }
                    });
                }

                // Mettre à jour les stats du joueur
                const updatedUser = await prisma.warPlayers.update({
                    where: {
                        petId: decoded.id
                    },
                    data: {
                        hp: finalHp,
                        pa: finalPa
                    },
                    include: {
                        map: true,
                        warPlayerItems: {
                            include: {
                                warItems: true
                            }
                        }
                    }
                });

                return res.status(200).json({ message: 'Objet utilisé avec succès', updatedUser });
            }



        }
        res.status(405).end(`Method ${req.method} Not Allowed`)
    } catch (err) {
        onError(err, res);
    }
}