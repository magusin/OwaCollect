import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).end('Unauthorized');
    }

    try {
        const now = new Date();

        // Supprimer les messages expirés
        await prisma.warMessages.deleteMany({
            where: {
                expiresAt: {
                    lte: now
                }
            }
        });

        console.log(`Expired messages deleted at ${now.toISOString()}`);
        res.status(200).json({ message: 'Expired messages deleted successfully' });
    } catch (error) {
        console.error('Error deleting expired messages:', error);
        res.status(500).json({ message: 'Error deleting expired messages', error: error.message });
    } finally {
        await prisma.$disconnect();
    }
}