import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';

// Initialiser le midleware Cors
const cors = Cors({
    methods: ['GET', 'HEAD'],
})

const prisma = new PrismaClient()

// Gestion des erreurs
function onError(err, res) {
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

// GET /api/card/draw/[category]

export default async function handler(req, res) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Token non fourni' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
        return res.status(401).json({ message: 'Token invalide ou expiré' });
    }
    try {
        await runMiddleware(req, res, cors)
        switch (req.method) {
            case 'GET':
                const cards = await prisma.card.findMany({
                    where: {
                        category: req.query.category,
                        isDraw: true
                    }
                })
                const selectedCards = [];
                for (let i = 0; i < 5; i++) {
                    const randomCard = cards[Math.floor(Math.random() * cards.length)];
                    selectedCards.push(randomCard);
                }

                await Promise.all(selectedCards.map(async (card) => {
                    await prisma.playercards.upsert({
                        where: {
                          petId_cardId: {
                            petId: decoded.id,
                            cardId: card.id
                          }
                        },
                        update: {
                          // Mise à jour des champs si l'enregistrement existe déjà
                          count: {
                            increment: 1
                          }
                        },
                        create: {
                          // Création d'un nouvel enregistrement si celui-ci n'existe pas
                          petId: decoded.id,
                          cardId: card.id,
                          count: 1
                        }
                      });
                }));

                res.status(200).json(selectedCards)
                break
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) { onError(err, res) }
    finally { await prisma.$disconnect() }
}