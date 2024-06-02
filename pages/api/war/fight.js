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

function calculateHit(attacker, defender) {
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