const calculatePassiveSpellsStats = (selectedSkills) => {
    const totalStats = {
        upRegen: 0,
    };

    selectedSkills?.forEach(skill => {
        totalStats.upRegen += skill.warSkills.upRegen || 0;
    });

    return totalStats;
};

export default calculatePassiveSpellsStats;