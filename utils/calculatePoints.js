export default function calculatePoints(userData) {
    return ((userData.subs * 500) + (userData.messages * 5) + (userData.gifts * 500) + (userData.bits * 1) + 500 - (userData.pointsUsed));
}