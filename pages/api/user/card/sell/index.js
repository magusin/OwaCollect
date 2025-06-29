import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import { getToken } from "next-auth/jwt";
import verifySignature from '../../../verifySignature';

// Initialiser le midleware Cors
const allowedOrigins = [process.env.NEXTAUTH_URL]
const corsOptions = {
    methods: ['PUT', 'HEAD'],
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

// PUT /api/user/card/sell
export default async function handler(req, res) {
    try {
        const nextToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

        if (!nextToken) {
            return res.status(400).json({ message: 'Utilisateur non authentifié' });
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
            return res.status(401).json({ message: 'Token invalide' });
        }
        await runMiddleware(req, res, corsMiddleware)
        switch (req.method) {
            case 'PUT':
                const { id, quantity, amount } = req.body;
                if (!id) {
                    return res.status(400).json({ message: 'Id de la carte non fourni' });
                }

                if (!quantity) {
                    return res.status(400).json({ message: 'Nombre de l\'oppération non fourni' });
                }

                if (!amount) {
                    return res.status(400).json({ message: 'Montant pour l\'oppération non fourni' });
                }

                if (typeof quantity !== 'number' || typeof amount !== 'number' || typeof id !== 'number') {
                    return res.status(400).json({ message: 'Invalid input types' });
                }

                // Récupérer la carte actuelle
                const currentCard = await prisma.playercards.findUnique({
                    where: {
                        petId_cardId: {
                            petId: decoded.id,
                            cardId: id
                        }
                    },
                    include: {
                        card: true
                    }
                });

                if (!currentCard) {
                    return res.status(400).json({ message: 'Carte non trouvée' });
                }

                if (currentCard.count <= quantity) {
                    return res.status(400).json({ message: 'Quantité invalide' });
                }

                let price;

                switch (currentCard.card.rarety) {
                    case "Commune":
                        price = 30;
                        break;
                    case "Rare":
                        price = 70;
                        break;
                    case "Epique":
                        price = 150;
                        break;
                    default:
                        // Gérer le cas où la rareté n'est pas reconnue
                        return res.status(400).json({ message: 'Rareté de la carte non reconnue' });
                }

                const totalExpectedCost = quantity * price;

                if (totalExpectedCost !== amount) {
                    return res.status(400).json({ message: 'Le coût fourni ne correspond pas au coût attendu' });
                }

                // Réduire le count de la carte actuelle
                await prisma.playercards.update({
                    where: {
                        petId_cardId: {
                            petId: decoded.id,
                            cardId: id
                        }
                    },
                    data: {
                        count: {
                            decrement: quantity
                        }
                    }
                });

                // Déduire les points du joueur
                const userData = await prisma.pets.update({
                    where: {
                        userId: decoded.id
                    },
                    data: {
                        pointsUsed: {
                            decrement: amount
                        }
                    }
                });

                // Récupérer toutes les cartes du joueur
                const allPlayerCards = await prisma.playercards.findMany({
                    where: {
                        petId: decoded.id
                    },
                    include: {
                        card: true
                    }
                });

                // Mapper et filtrer les infos à retourner
                 const safePlayerCards = allPlayerCards.map(card => ({
                    id: card.card.id,
                    name: card.card.name,
                    count: card.count,
                    rarety: card.card.rarety,
                    isNew: card.isNew,
                    isGold: card.isGold,
                    category: card.card.category,
                    number: card.card.number,
                    owned: card.count > 0,
                    picture: card.card.picture,
                    picture_back: card.card.picture_back,
                    picture_gold: card.isGold ? card.card.picture_gold : null
                }));

                res.status(200).json({ allPlayerCards: safePlayerCards, userData });
                break

            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) { onError(err, res) }
    finally { await prisma.$disconnect() }
}