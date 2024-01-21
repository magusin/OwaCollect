import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';

// Initialiser le midleware Cors
const cors = Cors({
    methods: ['POST', 'HEAD'],
})

const prisma = new PrismaClient()

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

// GET /api/card/draw

export default async function handler(req, res) {
    try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Token non fourni' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
        return res.status(401).json({ message: 'Token invalide ou expiré' });
    }
        await runMiddleware(req, res, cors)
        switch (req.method) {
            case 'POST':
                const { quantity, category, cost } = req.body;
                const cards = await prisma.card.findMany({
                    where: {
                        category: category,
                        isDraw: true
                    }
                })
                const totalDropRate = cards[cards.length - 1].dropRate;

                const selectRandomCard = () => {
                    let randomNum = Math.random() * totalDropRate;
                    for (const card of cards) {
                        if (randomNum - card.dropRate <= 0) {
                            return card;
                        }
                    }
                };

                const selectedCards = [];
                for (let i = 0; i < 5 * quantity; i++) {
                    const randomCard = selectRandomCard()
                    selectedCards.push(randomCard);
                }

                const selectedCardsMap = selectedCards.reduce((acc, card) => {
                    if (!acc[card.id]) {
                        acc[card.id] = { ...card, count: 0 };
                    }
                    acc[card.id].count += 1;
                    return acc;
                }, {});

                // Déduire les points du joueur
                const userData = await prisma.pets.update({
                    where: {
                        userId: decoded.id
                    },
                    data: {
                        pointsUsed: {
                            increment: cost
                        }
                    }
                });
                
                const transactionPromises = Object.values(selectedCardsMap).map(card => 
                    prisma.playercards.upsert({
                        where: {
                            petId_cardId: {
                                petId: decoded.id,
                                cardId: card.id
                            }
                        },
                        update: {
                            count: {
                                increment: card.count
                            }
                        },
                        create: {
                            petId: decoded.id,
                            cardId: card.id,
                            count: card.count
                        }
                    })
                );
                
                await prisma.$transaction(transactionPromises);

                res.status(200).json({selectedCards, userData})
                break
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) { onError(err, res) }
    finally { await prisma.$disconnect() }
}