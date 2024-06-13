export function calculateDefensePercent(defense) {
    return defense / (100 + defense);
}

function calculateDamage(attacker, spell, defender, isPhysical) {
    const baseDamage = isPhysical ? attacker.str : attacker.intel;
    const minDamage = spell.dmgMin;
    const maxDamage = spell.dmgMax;
    const randomDamage = Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;
    const rawDamage = Math.ceil(baseDamage / spell.divider) + randomDamage;

    let defense = isPhysical ? defender.def : defender.defM;
    let defensePercent = calculateDefensePercent(defense);

    // Réduction des dégâts par la défense en pourcentage
    const reducedDamage = rawDamage * (1 - defensePercent);

    return reducedDamage > 0 ? reducedDamage : 0; // Les dégâts ne peuvent pas être négatifs
}

function castSpell(attacker, defender, spell) {
    // Vérifier si l'attaquant a assez de PA
    if (attacker.pa < spell.cost) {
        console.log(`${attacker.name} n'a pas assez de PA pour lancer ${spell.name}`);
        return;
    }

    // Réduire les PA de l'attaquant
    attacker.pa -= spell.cost;

    // Vérifier si l'attaque touche
    if (!
        (attacker, defender)) {
        console.log(`${attacker.name} a raté son attaque ${spell.name}`);
        return;
    }

    // Vérifier si le défenseur esquive
    if (calculateEvade(defender, attacker)) {
        console.log(`${defender.name} a esquivé l'attaque ${spell.name}`);
        return;
    }

    // Calculer les dégâts
    const isPhysical = spell.type === 'physique';
    const damage = calculateDamage(attacker, spell, defender, isPhysical);
    defender.hp -= damage;
    console.log(`${attacker.name} inflige ${damage} dégâts avec ${spell.name} à ${defender.name}. Il reste ${defender.hp} points de vie à ${defender.name}.`);

    if (defender.hp <= 0) {
        console.log(`${defender.name} est vaincu! ${attacker.name} gagne!`);
    }
}

export function calculateHit(attacker, defender) {
    const levelDifference = defender.level - attacker.level;
    const hitChance = attacker.hit - (levelDifference * 2); // Ajuste la précision basée sur la différence de niveaux
    const randomValue = Math.random() * 100;
    return randomValue < hitChance; // L'attaque touche si la valeur aléatoire est inférieure à la précision ajustée
}

function calculateEvade(defender, attacker) {
    const levelDifference = defender.level - attacker.level;
    const evadeChance = defender.dex * 2 + (levelDifference * 2); // Ajuste l'esquive basée sur la différence de niveaux
    const randomValue = Math.random() * 100;
    return randomValue < evadeChance; // L'ennemi esquive si la valeur aléatoire est inférieure à la chance d'esquive ajustée
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