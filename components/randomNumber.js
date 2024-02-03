import React, { useState, useEffect } from 'react';

const RandomNumber = () => {
  const [number, setNumber] = useState(1); // Commence par 1
  const [isRunning, setIsRunning] = useState(true); // Contrôle si le nombre change
  const randomNum = Math.floor(Math.random() * 100) + 1;
  useEffect(() => {
    if (isRunning) {
      // Change le nombre chaque 50 millisecondes
      const interval = setInterval(() => {
        setNumber(randomNum);
      }, 50);

      // Arrête de changer le nombre après 2 secondes et se fixe sur un nombre aléatoire
      setTimeout(() => {
        clearInterval(interval);
        setIsRunning(false);
        setNumber(Math.floor(Math.random() * 100) + 1);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isRunning, randomNum]);

  return (
    <div>
      <h1>{number}</h1>
    </div>
  );
};

export default RandomNumber;