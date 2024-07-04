function calculateDmg (player, type, value, divider) {
 const dmg = type === 'str' ? Math.floor(player.str/ divider) + value : Math.floor(player.intel/ divider) + value;
 return dmg;
}

export default calculateDmg;