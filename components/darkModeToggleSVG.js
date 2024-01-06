// DarkModeToggleSVG.js
export default function DarkModeToggleSVG({ isDarkMode }) {
    return isDarkMode ? (
        // SVG pour le mode clair
<svg width="50px" height="30px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M17,7H7A5,5,0,0,0,7,17H17A5,5,0,0,0,17,7ZM7,15a3,3,0,1,1,3-3A3,3,0,0,1,7,15Z"></path> <path d="M0,0H24V24H0Z" fill="none"></path> </g></svg>    ) : (
        // SVG pour le mode sombre
<svg width="50px" height="30px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M17,10a2,2,0,1,1-2,2,2,2,0,0,1,2-2m0-3a5,5,0,0,1,0,10H7A5,5,0,1,1,7,7H17M7,9a3,3,0,0,0,0,6H17a3,3,0,0,0,0-6Z"></path> <rect width="24" height="24" fill="none"></rect> </g></svg>    );
}