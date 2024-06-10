const calculatePassiveSpellsStats = (selectedSkills) => {
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

export default calculatePassiveSpellsStats;