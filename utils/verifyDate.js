
export default function isDateBeforeToday(dateString) {
    // Convertir dateString en chaîne si ce n'est pas déjà le cas
    const rewardDate = new Date(dateString);
    const rewardDateString = rewardDate.toISOString(); // Format ISO : YYYY-MM-DDTHH:mm:ss.sssZ
  
    const today = new Date();
  
    // Extraire les parties année, mois, jour de la date actuelle
    const yearToday = today.getFullYear();
    const monthToday = String(today.getMonth() + 1).padStart(2, '0'); // Mois : 0 = janvier, 11 = décembre
    const dayToday = String(today.getDate()).padStart(2, '0'); // Jour du mois
  
    // Extraire les parties année, mois, jour de la date de récompense
    const yearReward = rewardDateString.substring(0, 4);
    const monthReward = rewardDateString.substring(5, 7);
    const dayReward = rewardDateString.substring(8, 10);
  
    // Comparaison explicite : année, mois, jour
    if (yearReward < yearToday) return true; // Année différente
    if (yearReward === String(yearToday) && monthReward < monthToday) return true; // Mois différent
    if (yearReward === String(yearToday) && monthReward === monthToday && dayReward < dayToday) return true; // Jour différent
  
    return false;
  }