import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function calculateDef (player, type) {
    if (type === 'Pstandard') {
        return Math.min(((player.defPStand + player.defP) / (100 + player.defPStand + player.level + player.defP) * 100).toFixed(2), 80)
    }

    if (type === 'Mstandard') {
        return Math.min(((player.defMStand + player.defM) / (100 + player.defMStand + player.level + player.defM) * 100).toFixed(2), 80)
    }

    if (type === 'Pierce') {
        return Math.min(((player.defPierce + player.defP) / (100 + player.defPierce + player.level + player.defP) * 100).toFixed(2), 80) 
    }

    if (type === 'Strike') {
        return Math.min(((player.defStrike + player.defP) / (100 + player.defStrike + player.level + player.defP) * 100).toFixed(2), 80) 
    }

    if (type === 'Slash') {
        return Math.min(((player.defSlash + player.defP) / (100 + player.defSlash + player.level + player.defP) * 100).toFixed(2), 80)
    }

    if (type === 'Fire') {
        return Math.min(((player.defFire + player.defM) / (100 + player.defFire + player.level + player.defM) * 100).toFixed(2), 80)
    }
                                                                                                                                                                         
    if (type === 'Lightning') {
        return Math.min(((player.defLightning + player.defM) / (100 + player.defLightning + player.level + player.defM) * 100).toFixed(2) , 80)
    }

    if (type === 'Holy') {
        return Math.min(((player.defHoly + player.defM) / (100 + player.defHoly + player.level + player.defM) * 100).toFixed(2), 80)
    }
}

export function calculateDamage(attacker, spell, defender) {
    const baseDamage = spell.stat === 'str' ? attacker.str : attacker.intel;
    const minDamage = spell.dmgMin;
    const maxDamage = spell.dmgMax;
    const randomDamage = Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;
    const rawDamage = Math.floor(baseDamage / spell.divider) + randomDamage;

    let defense = calculateDef(defender, spell.dmgType)
    // Réduction des dégâts par la défense en pourcentage
    const totalDamage = rawDamage - Math.ceil(rawDamage * defense / 100) 

    return totalDamage > 0 ? totalDamage : 1; // Les dégâts doivent être d'un minimum de 1
}

export function calculateDamageCrit(attacker, spell, defender) {
    const baseDamage = spell.stat === 'str' ? attacker.str : attacker.intel;
    const critDamage = spell.crit;
    const rawDamage = Math.floor(baseDamage / spell.divider) + critDamage;

    let defense = calculateDef(defender, spell.dmgType)
    // Réduction des dégâts par la défense en pourcentage
    const totalDamage = rawDamage - Math.ceil(rawDamage * defense / 100) 

    return totalDamage > 0 ? totalDamage : 1; // Les dégâts doivent être d'un minimum de 1
}

export function calculateHit(attacker, spell) {
    const hitChance = Math.min(95, attacker.hit + spell.hit)
    const randomValue = Math.random() * 100;
    return randomValue <= hitChance; // L'attaque touche si la valeur aléatoire est inférieure à la précision ajustée
}

export function calculateEvade(defender, type) {
    let evadeValue = type === 'str' ? defender.dex - defender.level : defender.acu - defender.level;

    // Assurez-vous que l'esquive est toujours entre 0 et 30
    const evadeChance = Math.max(0, Math.min(30, evadeValue));

    const randomValue = Math.random() * 100;

    return randomValue <= evadeChance; // L'ennemi esquive si la valeur aléatoire est inférieure à la chance d'esquive ajustée
}

export const calculatePassiveSpellsStats = (selectedSkills) => {
    const totalStats = {
        upStr: 0,
        upIntel: 0,
        upHit: 0,
        upCrit: 0,
        upHp: 0,
        upRegen: 0,
        upAcu: 0,
        upDex: 0,
        upDefPStand: 0,
        upDefMStand: 0,
        upDefStrike: 0,
        upDefFire: 0,
        upDefSlash: 0,
        upDefLightning: 0,
        upDefPierce: 0,
        upDefHoly: 0,
        upDefP: 0,
        upDefM: 0
    };

    selectedSkills.forEach(skill => {
        totalStats.upStr += skill.warSkills.upStr || 0;
        totalStats.upIntel += skill.warSkills.upIntel || 0;
        totalStats.upHit += skill.warSkills.upHit || 0;
        totalStats.upCrit += skill.warSkills.upCrit || 0;
        totalStats.upHp += skill.warSkills.upHp || 0;
        totalStats.upRegen += skill.warSkills.upRegen || 0;
        totalStats.upAcu += skill.warSkills.upAcu || 0;
        totalStats.upDex += skill.warSkills.upDex || 0;
        totalStats.upDefPStand += skill.warSkills.upDefPStand || 0;
        totalStats.upDefMStand += skill.warSkills.upDefMStand || 0;
        totalStats.upDefStrike += skill.warSkills.upDefStrike || 0;
        totalStats.upDefFire += skill.warSkills.upDefFire || 0;
        totalStats.upDefSlash += skill.warSkills.upDefSlash || 0;
        totalStats.upDefLightning += skill.warSkills.upDefLightning || 0;
        totalStats.upDefPierce += skill.warSkills.upDefPierce || 0;
        totalStats.upDefHoly += skill.warSkills.upDefHoly || 0;
        totalStats.upDefP += skill.warSkills.upDefP || 0;
        totalStats.upDefM += skill.warSkills.upDefM || 0;
    });

    return totalStats;
};

export const finalStats = (player, passiveSpellsStats) => {
    player = {
        ...player,
        hp: player.hp + passiveSpellsStats.upHp, 
        hpMax: player.hpMax + passiveSpellsStats.upHp,   
        str: player.str + passiveSpellsStats.upStr,
        intel: player.intel + passiveSpellsStats.upIntel,
        dex: player.dex + passiveSpellsStats.upDex,
        acu: player.acu + passiveSpellsStats.upAcu,
        crit: player.crit + passiveSpellsStats.upCrit,
        regen: player.regen + passiveSpellsStats.upRegen,
        defP: player.defP + passiveSpellsStats.upDefP,
        defPStand: player.defPStand + passiveSpellsStats.upDefPStand,
        defM: player.defM + passiveSpellsStats.upDefM,
        defMStand: player.defMStand + passiveSpellsStats.upDefMStand,
        defStrike: player.defStrike + passiveSpellsStats.upDefStrike,
        defFire: player.defFire + passiveSpellsStats.upDefFire,
        defSlash: player.defSlash + passiveSpellsStats.upDefSlash,
        defLightning: player.defLightning + passiveSpellsStats.upDefLightning,
        defPierce: player.defPierce + passiveSpellsStats.upDefPierce,
        defHoly: player.defHoly + passiveSpellsStats.upDefHoly
    };
        return player;
};

export const calculateDistance = (player, opponent) => {
    return Math.abs(player.position_x - opponent.position_x) + Math.abs(player.position_y - opponent.position_y);
}

export async function getTilesandCoordinates(playerPosition) {

    const positionXValue = playerPosition.position_x;
    const positionYValue = playerPosition.position_y;
    const limitValue = 5;

    // Déterminez les coordonnées de la plage de tuiles autour du joueur
    const startX = Math.max(1, positionXValue - limitValue);
    const endX = Math.min(20, positionXValue + limitValue);
    const startY = Math.max(1, positionYValue - limitValue);
    const endY = Math.min(20, positionYValue + limitValue);

    // Sélectionnez les tuiles dans la plage de coordonnées
    const tiles = await prisma.map.findMany({
        where: {
            position_x: { gte: startX, lte: endX },
            position_y: { gte: startY, lte: endY },
        },
        include: {
            warPlayers: {
                select: {
                    petId: true,
                    name: true,
                    imageUrl: true,
                    mapId: true,
                    level: true,
                    isDied: true
                }
            },
            warMonsters: { 
                select: {
                    id: true,
                    mapId: true,
                    level: true,
                    hp: true,
                    hpMax: true,
                    str: true,
                    intel: true,
                    dex: true,
                    acu: true,
                    monsters: {
                        select: {
                            name: true,
                            imageUrl: true
                        }
                    }
                }
            }
        }
    });

    const allCoordinates = [];
    for (let x = positionXValue - 5; x <= positionXValue + 5; x++) {
        for (let y = positionYValue - 5; y <= positionYValue + 5; y++) {
            allCoordinates.push({ position_x: x, position_y: y });
        }
    }
    return { tiles, allCoordinates };
}

export const xpToNextLevel = (level) => {
    return Math.floor(level * 10 + 5 * Math.pow(1.2, level -1));
}
