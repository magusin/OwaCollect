import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import { getToken } from "next-auth/jwt";
import verifySignature from '../../verifySignature';
import calculatePoints from '../../calculatePoints';
import { refreshAccessToken } from '../../auth/[...nextauth]';

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

const prisma = new PrismaClient();

const corsMiddleware = Cors(corsOptions);

// Gestion des erreurs
function onError(err, res) {
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Token invalide' });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expiré' });
    }

    res.status(500).json({ message: err.message })
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

// POST /api/card/draw

export default async function handler(req, res) {
    try {
        const nextToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

        if (!nextToken) {
            return res.status(401).json({ message: 'Utilisateur non authentifié' });
        }
        let accessToken = nextToken.accessToken;
        if (!accessToken) {
            return res.status(401).json({ message: 'Token non fourni' });
        }
        const signature = await verifySignature(req);
        if (!signature) {
            return res.status(400).json({ message: 'Signature invalide' });
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
            case 'POST':
                const { quantity, category, cost } = req.body;
                if (typeof quantity !== 'number' || typeof category !== 'string' || typeof cost !== 'number') {
                    return res.status(400).json({ message: 'Invalid input types' });
                }
                if (quantity < 1 || quantity > 10) {
                    return res.status(400).json({ message: 'Quantité invalide' });
                }
                if (quantity * 500 != cost) {
                    return res.status(400).json({ message: 'Prix invalide' });
                }
                const user = await prisma.pets.findUnique({
                    where: {
                        userId: decoded.id
                    }
                });

                // Calculer les points disponibles
                const availablePoints = await calculatePoints(user);
                // Vérifier si l'utilisateur a assez de points
                if (cost > availablePoints) {
                    return res.status(400).json({ message: 'Pas assez de points' });
                }
                // Tirer les cartes filtrées par catégorie
                const cards = await prisma.card.findMany({
                    where: {
                        category: category,
                        isDraw: true
                    },
                    orderBy: {
                        dropRate: 'asc'
                    }
                })
                // Définir le taux de drop total
                const totalDropRate = cards[cards.length - 1].dropRate;


                const selectRandomCard = () => {
                    let randomNum = Math.random() * totalDropRate;
                    let low = 0;
                    let high = cards.length - 1;

                    while (low <= high) {
                        let mid = Math.floor((low + high) / 2);
                        let midDropRate = cards[mid].dropRate;

                        if (midDropRate < randomNum) {
                            low = mid + 1;
                        } else if (mid > 0 && cards[mid - 1].dropRate >= randomNum) {
                            high = mid - 1;
                        } else {
                            return cards[mid];
                        }
                    }
                };

                const drawnCards = Array.from({ length: quantity * 5 }, () => selectRandomCard());
                console.log('Drawn:', drawnCards.length);
                const ownedRaw = await prisma.playercards.findMany({
                    where: { petId: decoded.id },
                    select: {
                        cardId: true,
                        isGold: true,
                        isNew: true
                    }
                });

                const ownedMap = new Map();
                for (const c of ownedRaw) {
                    const key = `${c.cardId}-${c.isGold ? 'gold' : 'normal'}`;
                    ownedMap.set(key, { isNew: c.isNew });
                }

                const resultMap = new Map();
                const selectedCards = [];

                for (const card of drawnCards) {
                    const hasNormal = ownedMap.has(`${card.id}-normal`);
                    const hasGold = ownedMap.has(`${card.id}-gold`);

                    // Détermine si on peut drop la version gold
                    let isGold = false;
                    if (hasNormal && card.picture_gold && !hasGold && Math.random() < 0.05) {
                        isGold = true;
                    } else if (hasGold) {
                        isGold = true;
                    }

                    const key = `${card.id}-${isGold ? 'gold' : 'normal'}`;
                    const existingStatus = ownedMap.get(key);

                    const isNew = !existingStatus || existingStatus.isNew;

                    // Met à jour ownedMap (important pour éviter de refaire 5% plusieurs fois)
                    ownedMap.set(key, { isNew });

                    // Pour l'affichage (exactement 50 cartes)
                    selectedCards.push({
                        id: card.id,
                        name: card.name,
                        picture: isGold ? card.picture_gold : card.picture,
                        picture_back: card.picture_back,
                        isGold,
                        isNew,
                        count: 1,
                        category: card.category,
                        rarety: card.rarety
                    });

                    if (!resultMap.has(key)) {
                        resultMap.set(key, {
                            id: card.id,
                            isGold,
                            isNew,
                            count: 1
                        });
                    } else {
                        resultMap.get(key).count += 1;
                        if (isNew) resultMap.get(key).isNew = true;
                    }
                }

                // Bulk insert
                const values = Array.from(resultMap.values()).map(c =>
                    `('${decoded.id}', ${c.id}, ${c.count}, ${c.isGold ? 1 : 0}, ${c.isNew ? 1 : 0})`
                  ).join(', ');
                  
                  await prisma.$executeRawUnsafe(`
                    INSERT INTO playercards (petId, cardId, count, isGold, isNew)
                    VALUES ${values}
                    ON DUPLICATE KEY UPDATE
                      count = count + VALUES(count),
                      isNew = IF(playercards.isNew = true OR (playercards.isGold = false AND VALUES(isGold) = true), true, VALUES(isNew)),
                      isGold = IF(playercards.isGold = true OR VALUES(isGold) = true, true, false)
                  `);

                const updatedUser = await prisma.pets.update({
                    where: { userId: decoded.id },
                    data: { pointsUsed: { increment: cost } }
                });

                res.status(200).json({ selectedCards, userData: updatedUser });
                break
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) { onError(err, res) }
    finally { await prisma?.$disconnect() }
}