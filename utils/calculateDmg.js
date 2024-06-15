function calculateDmg (player, type, value, divider) {
 const dmg = type === 'str' ? Math.floor(player.str/ divider) + value : Math.floor(player.int/ divider) + value;
 return dmg;
}

export default calculateDmg;