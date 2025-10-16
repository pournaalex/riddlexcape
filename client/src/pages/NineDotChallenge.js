import React, { useState } from 'react';
import ProgressBar from '../components/ProgressBar';

function NineDotChallenge() {
    const [progress, setProgress] = useState(0); // Game progress
    const [isCompleted, setIsCompleted] = useState(false);
    const FINAL_CODE = "LINE-MASTER-X4"; // Distinct final code

    const completeGame = () => {
        if (isCompleted) return;

        // In a real game, this would only run after the puzzle is solved correctly.
        setProgress(100);
        setIsCompleted(true);
        
        // Update local storage progress for the home page tracker
        const storedProgress = JSON.parse(localStorage.getItem('riddlescapeProgress')) || {};
        storedProgress['nine-dot'] = { title: '9-Dot Challenge', progress: 100 };
        localStorage.setItem('riddlescapeProgress', JSON.stringify(storedProgress));
    };

    return (
        <div className="game-page-container">
            <h2>9-Dot Challenge 🧠</h2>
            <ProgressBar percent={progress} label="Your Game Progress" />

            <div className="game-area">
                <p>Connect all 9 dots using only 4 straight lines without lifting your pen/mouse.</p>
                {/* Placeholder for the 9-dot puzzle drawing area */}
                <div style={{ border: '2px solid #333', padding: '20px', margin: '20px auto', width: '300px', height: '300px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', placeItems: 'center' }}>
                    {[...Array(9)].map((_, i) => <span key={i} style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: '#6200EE' }}></span>)}
                </div>
                
                <button onClick={completeGame} disabled={isCompleted}>
                    {isCompleted ? 'SOLVED' : 'Pretend Solve'}
                </button>
            </div>

            {isCompleted && (
                <div className="completion-message">
                    <h3>🎉 Challenge Complete!</h3>
                    <p>Your Completion Code is: <strong>{FINAL_CODE}</strong></p>
                    <p>Remember this code!</p>
                </div>
            )}
        </div>
    );
}

export default NineDotChallenge;