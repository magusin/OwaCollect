export default function isDateBeforeToday(dateString) {
    const rewardDate = new Date(dateString);
    const today = new Date();
    // Extraire les parties jour, mois et année de la date de récompense et de la date actuelle
    const rewardDay = rewardDate.getDate();
    const rewardMonth = rewardDate.getMonth();
    const rewardYear = rewardDate.getFullYear();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    // Comparer les parties jour, mois et année
    return (rewardYear < todayYear) ||
           (rewardYear === todayYear && rewardMonth < todayMonth) ||
           (rewardYear === todayYear && rewardMonth === todayMonth && rewardDay < todayDay);
  }