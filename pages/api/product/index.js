import Cors from 'cors'
import { getSession } from "next-auth/react";
import { PrismaClient } from '@prisma/client'

// Initialiser le midleware Cors
const cors = Cors({
    methods: ['GET', 'HEAD'],
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

// GET /api/product
export default async function handler(req, res) {
    const session = await getSession({ req });
    if (!session) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    try {
        await runMiddleware(req, res, cors)
        switch (req.method) {
            case 'GET':
                const products = await prisma.product.findMany()
                res.status(200).json(products)
                break
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) { onError(err, res) }
    finally { await prisma.$disconnect() }
}