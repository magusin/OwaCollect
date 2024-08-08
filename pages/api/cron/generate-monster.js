import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const levelsCounts = [
    { level: 1, count: 50 },
    { level: 5, count: 40 },
    { level: 10, count: 30 }
];

const getRandomValue = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export default async function handler(req, res) {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).end('Unauthorized');
    }

    try {
        const monsters = await prisma.monsters.findMany();

        for (const { level, count } of levelsCounts) {
            const existingCount = await prisma.warMonsters.count({
                where: { level: level }
            });

            const neededCount = count - existingCount;

            if (neededCount <= 0) {
                console.log(`Level ${level} already has ${existingCount} warmonsters, no more needed.`);
                continue;
            }
            const filteredMonsters = monsters.filter(monster => monster.level === level);

            for (let i = 0; i < neededCount; i++) { // Correction de la boucle for
                const randomMonster = filteredMonsters[Math.floor(Math.random() * filteredMonsters.length)];
                const hp = getRandomValue(randomMonster.hpMin, randomMonster.hpMax);

                const warmonsterData = {
                    monsterId: randomMonster.id,
                    mapId: Math.floor(Math.random() * 400) + 1,
                    level: level,
                    crit: randomMonster.crit,
                    hit: randomMonster.hit,
                    hp: hp,
                    hpMax: hp,
                    acu: getRandomValue(randomMonster.acuMin, randomMonster.acuMax),
                    dex: getRandomValue(randomMonster.dexMin, randomMonster.dexMax),
                    str: getRandomValue(randomMonster.strMin, randomMonster.strMax),
                    intel: getRandomValue(randomMonster.intelMin, randomMonster.intelMax),
                    defP: getRandomValue(randomMonster.defPMin, randomMonster.defPMax),
                    defM: getRandomValue(randomMonster.defMMin, randomMonster.defMMax),
                    defHoly: getRandomValue(randomMonster.defHolyMin, randomMonster.defHolyMax),
                    defPStand: getRandomValue(randomMonster.defPStandMin, randomMonster.defPStandMax),
                    defMStand: getRandomValue(randomMonster.defMStandMin, randomMonster.defMStandMax),
                    defPierce: getRandomValue(randomMonster.defPierceMin, randomMonster.defPierceMax),
                    defSlash: getRandomValue(randomMonster.defSlashMin, randomMonster.defSlashMax),
                    defFire: getRandomValue(randomMonster.defFireMin, randomMonster.defFireMax),
                    defLightning: getRandomValue(randomMonster.defLightningMin, randomMonster.defLightningMax),
                    defStrike: getRandomValue(randomMonster.defStrikeMin, randomMonster.defStrikeMax)
                };

                await prisma.warMonsters.create({
                    data: warmonsterData
                });

                console.log(`Monster generated at ${new Date().toISOString()}`);
            }
        }

        res.status(200).json({ message: 'Warmonsters and loots generated successfully.' });
    } catch (error) {
        console.error('Error generating warmonsters and loots:', error);
        res.status(500).json({ message: 'Error generating warmonsters and loots', error: error.message });
    } finally {
        await prisma.$disconnect();
    }
}