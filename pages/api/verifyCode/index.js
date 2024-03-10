import Cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getToken } from "next-auth/jwt";
import verifySignature from '../verifySignature';

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

// POST /api/verifyCode

export default async function handler(req, res) {
    try {
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
        const signature = await verifySignature(req);
        if (!signature) {
            return res.status(400).json({ message: 'Signature invalide' });
        }
        await runMiddleware(req, res, corsMiddleware)
        switch (req.method) {
            case 'POST':
                const userCode = req.body.code;
                const secretCode = process.env.SECRET_CODE;
                if (!userCode) {
                    return res.status(400).json({ message: 'Code non fourni' });
                }
                if (userCode.toLowerCase() === '5') {
                    return res.status(200).json({ success: false, message: 'Les 5 mentent se sont des 8' });
                }
                else if (userCode.toLowerCase() === 'chien' || userCode.toLowerCase() === 'dog') {
                    return res.status(200).json({ success: false, message: 'Je suis de la team chat' });
                }
                else if (userCode.toLowerCase() === 'sesame' || userCode.toLowerCase() === 'sésame') {
                    const secretAlreadyDiscovered = await prisma.secretsdiscovered.findUnique({
                        where: { userId_secretId: { userId: decoded.id, secretId: 1 } }
                    });
                
                    if (!secretAlreadyDiscovered) { 
                        await prisma.secretsdiscovered.create({ 
                            data: {
                                userId: decoded.id,
                                secretId: 1
                            }
                        });
                        await prisma.pets.update({ 
                            where: { userId: decoded.id },
                            data: {
                                pointsUsed: {
                                    decrement: 500
                                }
                            }
                        });
                        return res.status(200).json({ success: true, message: 'Code correct ! Vous avez débloqué la récompense: 500 OC', secret1: true });
                    } else {
                        return res.status(200).json({ success: false, message: 'Vous avez déjà eu cette récompense' });
                    }
                }
                else if (userCode.toLowerCase() === 'streamer' || userCode.toLowerCase() === 'streameur') {
                    const secretAlreadyDiscovered = await prisma.secretsdiscovered.findUnique({
                        where: { userId_secretId: { userId: decoded.id, secretId: 2 } }
                    });
                
                    if (!secretAlreadyDiscovered) { 
                        await prisma.secretsdiscovered.create({ 
                            data: {
                                userId: decoded.id,
                                secretId: 2
                            }
                        });
                        await prisma.pets.update({ 
                            where: { userId: decoded.id },
                            data: {
                                pointsUsed: {
                                    decrement: 500
                                }
                            }
                        });
                        return res.status(200).json({ success: true, message: 'Code correct ! Vous avez débloqué la récompense: 500 OC', secret2: true });
                    } else {
                        return res.status(200).json({ success: false, message: 'Vous avez déjà eu cette récompense' });
                    }
                }
                else if (userCode.toLowerCase() === 'cicada') {
                    const secretAlreadyDiscovered = await prisma.secretsdiscovered.findUnique({
                        where: { userId_secretId: { userId: decoded.id, secretId: 3 } }
                    });
                
                    if (!secretAlreadyDiscovered) { 
                        await prisma.secretsdiscovered.create({ 
                            data: {
                                userId: decoded.id,
                                secretId: 3
                            }
                        });
                        await prisma.pets.update({ 
                            where: { userId: decoded.id },
                            data: {
                                pointsUsed: {
                                    decrement: 500
                                }
                            }
                        });
                        return res.status(200).json({ success: true, message: 'Code correct ! Vous avez débloqué la récompense: 500 OC', secret3: true });
                    } else {
                        return res.status(200).json({ success: false, message: 'Vous avez déjà eu cette récompense' });
                    }
                }
                else if (userCode.toLowerCase() === 'backrooms' || userCode.toLowerCase() === 'backroom') {
                    const secretAlreadyDiscovered = await prisma.secretsdiscovered.findUnique({
                        where: { userId_secretId: { userId: decoded.id, secretId: 4 } }
                    });
                
                    if (!secretAlreadyDiscovered) { 
                        await prisma.secretsdiscovered.create({ 
                            data: {
                                userId: decoded.id,
                                secretId: 4
                            }
                        });
                        await prisma.pets.update({ 
                            where: { userId: decoded.id },
                            data: {
                                pointsUsed: {
                                    decrement: 500
                                }
                            }
                        });
                        return res.status(200).json({ success: true, message: 'Code correct ! Vous avez débloqué la récompense: 500 OC', secret4: true });
                    } else {
                        return res.status(200).json({ success: false, message: 'Vous avez déjà eu cette récompense' });
                    }
                }
                else if (userCode.toLowerCase() === 'enigma') {
                    const secretAlreadyDiscovered = await prisma.secretsdiscovered.findUnique({
                        where: { userId_secretId: { userId: decoded.id, secretId: 5 } } // Vérifie si le secret 5 a déjà été découvert par cet utilisateur
                    });
                
                    if (!secretAlreadyDiscovered) { // Si le secret n'a pas encore été découvert
                        await prisma.secretsdiscovered.create({ // Ajouter une nouvelle entrée dans la table secretsdiscovered
                            data: {
                                userId: decoded.id,
                                secretId: 5
                            }
                        });
                        await prisma.pets.update({ // Mettre à jour d'autres données dans la table pets si nécessaire
                            where: { userId: decoded.id },
                            data: {
                                pointsUsed: {
                                    decrement: 500
                                }
                            }
                        });
                        return res.status(200).json({ success: true, message: 'Code correct ! Vous avez débloqué la récompense: 500 OC', secret5: true });
                    } else {
                        return res.status(200).json({ success: false, message: 'Vous avez déjà eu cette récompense' });
                    }
                }
                else if (userCode.toLowerCase() === 'bigfoot') {
                    const secretAlreadyDiscovered = await prisma.secretsdiscovered.findUnique({
                        where: { userId_secretId: { userId: decoded.id, secretId: 6 } }
                    });
                
                    if (!secretAlreadyDiscovered) { 
                        await prisma.secretsdiscovered.create({ 
                            data: {
                                userId: decoded.id,
                                secretId: 6
                            }
                        });
                        await prisma.pets.update({ 
                            where: { userId: decoded.id },
                            data: {
                                pointsUsed: {
                                    decrement: 500
                                }
                            }
                        });
                        return res.status(200).json({ success: true, message: 'Code correct ! Vous avez débloqué la récompense: 500 OC', secret6: true });
                    } else {
                        return res.status(200).json({ success: false, message: 'Vous avez déjà eu cette récompense' });
                    }
                }
                else if (userCode.toLowerCase() === 'taured') {
                    const secretAlreadyDiscovered = await prisma.secretsdiscovered.findUnique({
                        where: { userId_secretId: { userId: decoded.id, secretId: 7 } }
                    });
                
                    if (!secretAlreadyDiscovered) { 
                        await prisma.secretsdiscovered.create({ 
                            data: {
                                userId: decoded.id,
                                secretId: 7
                            }
                        });
                        await prisma.pets.update({ 
                            where: { userId: decoded.id },
                            data: {
                                pointsUsed: {
                                    decrement: 500
                                }
                            }
                        });
                        return res.status(200).json({ success: true, message: 'Code correct ! Vous avez débloqué la récompense: 500 OC', secret7: true });
                    } else {
                        return res.status(200).json({ success: false, message: 'Vous avez déjà eu cette récompense' });
                    }
                }
                else if (userCode.toLowerCase() === 'sin') {
                    const secretAlreadyDiscovered = await prisma.secretsdiscovered.findUnique({
                        where: { userId_secretId: { userId: decoded.id, secretId: 8 } }
                    });
                
                    if (!secretAlreadyDiscovered) { 
                        await prisma.secretsdiscovered.create({ 
                            data: {
                                userId: decoded.id,
                                secretId: 8
                            }
                        });
                        await prisma.pets.update({ 
                            where: { userId: decoded.id },
                            data: {
                                pointsUsed: {
                                    decrement: 500
                                }
                            }
                        });
                        return res.status(200).json({ success: true, message: 'Code correct ! Vous avez débloqué la récompense: 500 OC', secret8: true });
                    } else {
                        return res.status(200).json({ success: false, message: 'Vous avez déjà eu cette récompense' });
                    }
                }
                else if (userCode.toLowerCase() === secretCode) {
                    const secretShopLink = uuidv4();
                    return res.status(200).json({ success: true, secretShopLink: secretShopLink });
                } else if (userCode.toLowerCase() === '5') {
                    return res.status(200).json({ success: false, message: 'Les 5 sont en réalité des 8' });
                } else {
                    return res.status(200).json({ success: false, message: 'Code incorrect'});
                }
            default:
                res.setHeader('Allow', ['POST'])
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) {
        onError(err, res)
    }
    finally { await prisma.$disconnect() }
}

