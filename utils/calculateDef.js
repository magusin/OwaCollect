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

export default calculateDef;