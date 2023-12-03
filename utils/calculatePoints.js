export default function calculatePoints(userData) {
    return ((userData.subs * 500) + (userData.messages * 5) + (userData.bits * 1));
}