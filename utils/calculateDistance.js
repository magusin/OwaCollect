const calculateDistance = (player, opponent) => {
    return Math.abs(player.position_x - opponent.position_x) + Math.abs(player.position_y - opponent.position_y);
}

export default calculateDistance;