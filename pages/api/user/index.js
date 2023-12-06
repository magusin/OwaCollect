import Cors from 'cors'
// import { getSession } from "next-auth/react";
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';

// Initialiser le midleware Cors
const cors = Cors({
    methods: ['GET', 'PUT', 'HEAD'],
})

const prisma = new PrismaClient()

// Gestion des erreurs
function onError(err, res) {
    console.log(err)
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

// GET /api/user

export default async function handler(req, res) {
    // const session = await getSession({ req });
    const token = req.headers.authorization?.split(' ')[1]; // JWT envoyé dans le header Authorization
    if (!token) {
        return res.status(401).json({ message: 'Token non fourni' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('decoded:', decoded)
    if (!decoded) {
        return res.status(401).json({ message: 'Token invalide' });
    }
    // if (!session) {
    //     res.status(401).json({ error: "Unauthorized" });
    //     return;
    // }
    try {
        await runMiddleware(req, res, cors)
        switch (req.method) {
            case 'GET':
                const user = await prisma.pets.upsert({
                    where: {
                        userId: decoded.id
                    },
                    create: {
                        userId: decoded.id,
                        name: decoded.name,
                        imageUrl: decoded.image,
                        subs: 0,
                        guess: 0,
                        bits: 0,
                        quiz: 0,
                        gifts: 0,
                        messages: 0,
                        guess: 0
                    },
                    update: {}
                })
                res.status(200).json(user)
                break
            case 'PUT':
                const { pointsUsed } = req.body
                const updatedUser = await prisma.pets.update({
                    where: {
                        userId: decoded.id
                    },
                    data: {
                        pointsUsed: pointsUsed,
                    }
                })
                console.log('updatedUser:', updatedUser)
                res.status(200).json(updatedUser)
                break
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) { onError(err, res) }
    finally { await prisma.$disconnect() }
}