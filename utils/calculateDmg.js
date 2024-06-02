function calculateDmg (player, type, value, divider) {
 const dmg = type === 'str' ? Math.ceil(player.str/ divider) + value : Math.ceil(player.int/ divider) + value;
 return dmg;
}

export default calculateDmg;