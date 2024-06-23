import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).end('Unauthorized');
      }

    try {
        const players = await prisma.warPlayers.findMany({
        });

        for (const player of players) {
            const newHp = Math.min(player.hp + player.regen, player.hpMax);
            const newPa = Math.min(player.pa + 4, player.paMax);

            await prisma.warPlayers.update({
                where: {
                    petId: player.petId
                },
                data: {
                    hp: newHp,
                    pa: newPa
                }
            });
        }

        console.log(`Player stats updated at ${new Date().toISOString()}`);
        res.status(200).json({ message: 'Player stats updated successfully' });
    } catch (error) {
        console.error('Error updating player stats:', error);
        res.status(500).json({ message: 'Error updating player stats', error: error.message });
    } finally {
        await prisma.$disconnect();
    }
}