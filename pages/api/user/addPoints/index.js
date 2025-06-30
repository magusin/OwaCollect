import Cors from 'cors'
import { PrismaClient } from '@prisma/client'

// Initialiser le midleware Cors
const allowedOrigins = [process.env.NEXTAUTH_URL]
const corsOptions = {
    methods: ['POST'],
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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, amount, username, password } = req.body;

  if (!userId || !amount || !password ) return res.status(400).json({ error: 'Missing params' });

  // Vérifie le mot de passe
  if (password !== process.env.API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    await runMiddleware(req, res, corsMiddleware)
    let user = await prisma.pets.findFirst({ where: { userId: userId } });

    // S'il n'existe pas, on le crée
    if (!user) {
        user = await prisma.pets.create({
          data: {
            userId,
            points: amount,
            name: username,
            imageUrl: `https://static-cdn.jtvnw.net/jtv_user_pictures/bfdd648d-697a-4379-8cf7-76ebb5a09699-profile_image-150x150.png`
          }
        })
  
        return res.status(201).json({ created: true, points: user.points })
      }

    const updated = await prisma.pets.update({
      where: { userId: userId },
      data: { pointsUsed: { decrement: amount } }
    });

    return res.status(200).json({ success: true, points: updated.pointsUsed });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}