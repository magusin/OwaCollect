function calculateDef (player, type) {
    if (type === 'Pstandard') {
        return ((player.defPStand + player.defP) / (100 + player.defPStand + player.level + player.defP) * 100).toFixed(2)
    }

    if (type === 'Mstandard') {
        return ((player.defMStand + player.defM) / (100 + player.defMStand + player.level + player.defM) * 100).toFixed(2)
    }

    if (type === 'Pierce') {
        return ((player.defPierce + player.defP) / (100 + player.defPierce + player.level + player.defP) * 100).toFixed(2) 
    }

    if (type === 'Strike') {
        return ((player.defStrike + player.defP) / (100 + player.defStrike + player.level + player.defP) * 100).toFixed(2) 
    }

    if (type === 'Slash') {
        return ((player.defSlash + player.defP) / (100 + player.defSlash + player.level + player.defP) * 100).toFixed(2)
    }

    if (type === 'Fire') {
        return ((player.defFire + player.defM) / (100 + player.defFire + player.level + player.defM) * 100).toFixed(2)
    }
                                                                                                                                                                         
    if (type === 'Lightning') {
        return ((player.defLightning + player.defM) / (100 + player.defLightning + player.level + player.defM) * 100).toFixed(2) 
    }

    if (type === 'Holy') {
        return ((player.defHoly + player.defM) / (100 + player.defHoly + player.level + player.defM) * 100).toFixed(2)
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
    let evadeChance = type === 'str' ? defender.dex - defender.level : defender.acu - defender.level;

    // Assurez-vous que l'esquive est toujours entre 0 et 30
    evadeChance = Math.max(0, Math.min(30, evadeChance));

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