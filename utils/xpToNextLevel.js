export default function xpToNextLevel (level) {
    return Math.floor(level * 10 + 5 * Math.pow(1.2, level -1));
}