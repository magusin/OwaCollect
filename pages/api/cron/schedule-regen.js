import { PrismaClient } from '@prisma/client';
import calculatePassiveSpellsStats from '../calculatePassiveSpellsStats';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).end('Unauthorized');
    }

    try {
        const players = await prisma.warPlayers.findMany({
            include: {
                warPlayerSkills: {
                    include: {
                        warSkills: true
                    }
                }
            }
        });

        for (const player of players) {
            const passiveSkills = player.warPlayerSkills.filter(skill => skill.warSkills.type === 'passif' && skill.isSelected);
            const passiveStats = calculatePassiveSpellsStats(passiveSkills);

            const newHp = Math.min(player.hp + player.regen + passiveStats.upRegen, player.hpMax);
            const newPa = Math.min(player.pa + 2, player.paMax);

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