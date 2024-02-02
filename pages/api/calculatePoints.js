export default async function calculatePoints(userData) {
    return ((userData.subs * 500) + (userData.messagesOC * 5) + (userData.gifts * 500) + (userData.bits * 1) + 500 - (userData.pointsUsed));
}