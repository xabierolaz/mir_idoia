import React, { useState, useEffect } from 'react';

export default function Timer({ initialTime, isPaused, onTimeUp }) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  useEffect(() => {
    if (!isPaused && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            onTimeUp && onTimeUp();
            return 0;
          }
          return prev - 1;
        });
        setElapsedTime(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isPaused, timeRemaining, onTimeUp]);
  
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getTimeColor = () => {
    const percentRemaining = (timeRemaining / initialTime) * 100;
    if (percentRemaining <= 10) return '#e74c3c';
    if (percentRemaining <= 25) return '#f39c12';
    return '#2ecc71';
  };
  
  const percentageComplete = ((initialTime - timeRemaining) / initialTime) * 100;
  
  return (
    <div className="timer-container">
      <div className="timer-display">
        <div className="timer-label">Tiempo restante</div>
        <div className="timer-value" style={{ color: getTimeColor() }}>
          {formatTime(timeRemaining)}
        </div>
        <div className="timer-elapsed">
          Tiempo transcurrido: {formatTime(elapsedTime)}
        </div>
      </div>
      <div className="timer-progress">
        <div 
          className="timer-progress-bar" 
          style={{ 
            width: `${percentageComplete}%`,
            backgroundColor: getTimeColor()
          }}
        />
      </div>
    </div>
  );
}