import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../components/ProgressBar';

// --- CONFIG ---
const GAME_ID = 'painted-cube';
const CUBE_SIZE = 5;
const CORRECT_ANSWER = 36; 
const FINAL_CODE = "JET2MAZE"; 
const ACCESS_CODE_FROM = "BETA"; 

function PaintedCubeChallenge(props) {
    const { username, isGameOver, completeGame, timeRemaining, formatTime } = props;
    
    const navigate = useNavigate(); 
    
    // --- Defensive Check: If no username, abort rendering immediately ---
    if (!username) {
        navigate('/'); 
        return null; 
    }
    // -------------------------------------------------------------------
    
    const USER_STORAGE_KEY = `riddlescapeProgress_${username}`; 

    const [progress, setProgress] = useState(0); 
    const [isCompleted, setIsCompleted] = useState(false);
    const [guess, setGuess] = useState('');
    const [message, setMessage] = useState('Enter the correct number of blocks.');
    const [score, setScore] = useState(0); 

    // --- EFFECT 1: Redirect on Time Out ---
    useEffect(() => {
        if (isGameOver) {
            navigate('/');
        }
    }, [isGameOver, navigate]);

    // --- EFFECT 2: Reset on Entry ---
    useEffect(() => {
        
        const storedProgress = localStorage.getItem(USER_STORAGE_KEY);
        let reset = true; 
        
        if (storedProgress) {
            try {
                // Check local storage for consistency
                JSON.parse(storedProgress);
            } catch (e) {
                console.error("Storage error on load:", e);
            }
        }
        
        if (reset) {
            const storedProgress = JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || {};
            storedProgress[GAME_ID] = { title: 'Painted Cube Challenge', progress: 0, score: 0 };
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(storedProgress));

            setProgress(0);
            setIsCompleted(false);
            setGuess('');
            setMessage('Enter the correct number of blocks.');
        }
        
    }, [USER_STORAGE_KEY]);
    
    // --- Handlers ---
    
    const handleGuessSubmit = () => {
        if (isCompleted || isGameOver) return;
        
        const submittedGuess = parseInt(guess.trim());
        
        if (isNaN(submittedGuess)) {
            setMessage("Please enter a valid number.");
            return;
        }

        setProgress(Math.min(99, submittedGuess / CORRECT_ANSWER * 100)); // Dynamic progress bar update
        
        if (submittedGuess === CORRECT_ANSWER) {
            completeGameAction(submittedGuess);
        } else {
            setMessage(`Incorrect guess (${submittedGuess}). Try again!`);
        }
    };

    const completeGameAction = (finalResult) => {
        setProgress(100);
        setIsCompleted(true);
        const finalScore = 100; 
        setScore(finalScore);
        
        setMessage(`SUCCESS! You found ${finalResult} blocks.`);

        // 1. Update global game completion status
        completeGame(GAME_ID); 

        // 2. Update local storage progress using the username key
        const storedProgress = JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || {};
        storedProgress[GAME_ID] = { title: 'Painted Cube Challenge', progress: 100, score: finalScore };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(storedProgress));
    };
    
    const handleReturnHome = () => {
        navigate('/');
    };

    const isDisabled = isCompleted || isGameOver;
    
    const renderTimer = () => (
        <div className="timer-display-game">
            <span className={timeRemaining <= 60 ? 'timer-critical' : 'timer-normal'}>
                {formatTime(timeRemaining)}
            </span>
        </div>
    );

    return (
        <div className="game-page-container">
            {renderTimer()} 
            <h2>Painted Cube Challenge 🟥🟦</h2>
            <p className="user-note">
                <span style={{color: 'var(--accent-glow)'}}>ACCESS CODE: {ACCESS_CODE_FROM}</span>
            </p>
            <ProgressBar percent={progress} label="Your Game Progress" />
            
            <div className="game-area">
                <p>
                    Imagine a solid cube built from small, 1-inch wooden blocks. The total structure is a **{CUBE_SIZE}x{CUBE_SIZE}x{CUBE_SIZE}** cube. All six outer faces of the large cube are painted blue.
                </p>
                <p>
                    **How many of the small 1-inch blocks have paint on exactly two of their faces?**
                </p>
                <p className={isGameOver ? 'error-message' : ''}>{isGameOver ? 'TIME IS UP! Go back to Home.' : message}</p>
                
                <div className="cube-input-area" style={{marginTop: '25px'}}>
                    <input
                        type="number"
                        placeholder="Enter your answer"
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        disabled={isDisabled}
                        style={{padding: '10px', width: '200px', textAlign: 'center', backgroundColor: '#20023a', color: 'var(--text-primary)', border: '1px solid var(--border-glow)'}}
                    />
                    <button 
                        onClick={handleGuessSubmit} 
                        disabled={isDisabled || guess.trim() === ''}
                        className="calc-button working" 
                        style={{marginLeft: '15px', width: '100px', height: '42px'}}
                    >
                        Submit
                    </button>
                </div>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                 <button 
                    onClick={handleReturnHome} 
                    className="return-home-button"
                 >
                    🔙 Return to RiddlEscape Home
                 </button>
            </div>


            {isCompleted && (
                <div className="completion-message">
                    <h3>🎉 Challenge Complete! (Score: {score})</h3>
                 
                    <p>Go back to home to finish the game!</p>
                </div>
            )}
        </div>
    );
}

export default PaintedCubeChallenge;