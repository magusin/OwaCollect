import React, { useState } from 'react';

const Switch = ({onSwitchChange}) => {
    const [position, setPosition] = useState(75); // Position initiale du curseur

    const handleClick = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left; // Position x relative au SVG
        const svgWidth = rect.width;

        // Établir des plages de clics
        const leftRange = svgWidth / 3;
        const rightRange = 2 * svgWidth / 3;
        let newPosition;

        if (x < leftRange) {
            newPosition = 30;
        } else if (x >= leftRange && x < rightRange) {
            newPosition = 75;
        } else {
            newPosition = 120;
        }

        setPosition(newPosition);
        if (onSwitchChange) {
            onSwitchChange(newPosition);
        }
    };

    return (
        <div className='flex items-center justify-center font-bold'>
            <span className={`${position === 30 ? 'text-blue-500' : ''}`}>Non possédé</span>
            <svg onClick={handleClick} xmlns="http://www.w3.org/2000/svg" width="150" height="75">
                <rect x="15" y="22" rx="22" ry="22" width="120" height="30" fill="grey"/>
                <circle cx="30" cy="37" r="12" fill="yellow"/>
                <circle cx="75" cy="37" r="12" fill="black"/>
                <circle cx="120" cy="37" r="12" fill="orange"/>
                <circle cx={position} cy="37" r="15" fill="white" stroke="black" stroke_width="1"/>
            </svg>
            <span className={`${position === 120 ? 'text-blue-500' : ''}`}>Possédé</span>
        </div>
    );
};

export default Switch;