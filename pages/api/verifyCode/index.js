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
                if (userCode.toLowerCase() === 'sesame' || userCode.toLowerCase() === 'sésame') {
                    const user = await prisma.pets.findUnique({
                        where: { userId: decoded.id },
                    });
                    if (!user.secret1) {
                        await prisma.pets.update({
                            where: { userId: decoded.id },
                            data: {
                                secret1: true,
                                pointsUsed: {
                                    decrement : 500
                                }
                            }
                        });
                    } else {
                        return res.status(200).json({ success: false, message: 'Vous avez déjà eu cette récompense'});
                    }
                    
                    return res.status(200).json({ success: true, message: 'Code correct ! Vous avez débloqué la récompense: 500 OC', secret1: true })
                }
                else if (userCode.toLowerCase() === 'streamer' || userCode.toLowerCase() === 'streameur') {
                    const user = await prisma.pets.findUnique({
                        where: { userId: decoded.id },
                    });
                    if (!user.secret2) {
                        await prisma.pets.update({
                            where: { userId: decoded.id },
                            data: {
                                secret2: true,
                                pointsUsed: {
                                    decrement : 500
                                }
                            }
                        });
                    } else {
                        return res.status(200).json({ success: false, message: 'Vous avez déjà eu cette récompense'});
                    }
                    
                    return res.status(200).json({ success: true, message: 'Code correct ! Vous avez débloqué la récompense: 500 OC', secret2: true })
                }
                else if (userCode.toLowerCase() === 'cicada') {
                    const user = await prisma.pets.findUnique({
                        where: { userId: decoded.id },
                    });
                    if (!user.secret3) {
                        await prisma.pets.update({
                            where: { userId: decoded.id },
                            data: {
                                secret3: true,
                                pointsUsed: {
                                    decrement : 500
                                }
                            }
                        });
                    } else {
                        return res.status(200).json({ success: false, message: 'Vous avez déjà eu cette récompense'});
                    }
                    
                    return res.status(200).json({ success: true, message: 'Code correct ! Vous avez débloqué la récompense: 500 OC', secret3: true })
                }
                else if (userCode.toLowerCase() === 'backrooms' || userCode.toLowerCase() === 'backroom') {
                    const user = await prisma.pets.findUnique({
                        where: { userId: decoded.id },
                    });
                    if (!user.secret4) {
                        await prisma.pets.update({
                            where: { userId: decoded.id },
                            data: {
                                secret4: true,
                                pointsUsed: {
                                    decrement : 500
                                }
                            }
                        });
                    } else {
                        return res.status(200).json({ success: false, message: 'Vous avez déjà eu cette récompense'});
                    }
                    
                    return res.status(200).json({ success: true, message: 'Code correct ! Vous avez débloqué la récompense: 500 OC', secret4: true })
                }
                else if (userCode.toLowerCase() === 'enigma') {
                    const user = await prisma.pets.findUnique({
                        where: { userId: decoded.id },
                    });
                    if (!user.secret5) {
                        await prisma.pets.update({
                            where: { userId: decoded.id },
                            data: {
                                secret5: true,
                                pointsUsed: {
                                    decrement : 500
                                }
                            }
                        });
                    } else {
                        return res.status(200).json({ success: false, message: 'Vous avez déjà eu cette récompense'});
                    }
                    
                    return res.status(200).json({ success: true, message: 'Code correct ! Vous avez débloqué la récompense: 500 OC', secret5: true })
                }
                else if (userCode.toLowerCase() === 'bigfoot') {
                    const user = await prisma.pets.findUnique({
                        where: { userId: decoded.id },
                    });
                    if (!user.secret6) {
                        await prisma.pets.update({
                            where: { userId: decoded.id },
                            data: {
                                secret6: true,
                                pointsUsed: {
                                    decrement : 500
                                }
                            }
                        });
                    } else {
                        return res.status(200).json({ success: false, message: 'Vous avez déjà eu cette récompense'});
                    }
                    
                    return res.status(200).json({ success: true, message: 'Code correct ! Vous avez débloqué la récompense: 500 OC', secret6: true })
                }
                else if (userCode.toLowerCase() === secretCode) {
                    const secretShopLink = uuidv4();
                    return res.status(200).json({ success: true, secretShopLink: secretShopLink });
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

