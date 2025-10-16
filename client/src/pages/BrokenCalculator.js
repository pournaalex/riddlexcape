import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../components/ProgressBar';

// Helper function (Copied from Home.js)
const getUserId = () => {
    let userId = localStorage.getItem('riddlescapeUserId');
    if (!userId) {
        userId = Math.random().toString(36).substring(2, 9);
        localStorage.setItem('riddlescapeUserId', userId);
    }
    return userId;
};

function BrokenCalculator() {
    // --- Setup ---
    const navigate = useNavigate(); 
    const TARGET_NUMBER = 42;
    const WORKING_KEYS = [1, 2, 5, '+', '-', '*']; 
    const BROKEN_KEYS = [3, 4, 6, 7, 8, 9, 0, '/']; 
    const FINAL_CODE = "MATH-WIZ-BEEP"; 
    
    // Get the user-specific storage key once on load
    const USER_STORAGE_KEY = `riddlescapeProgress_${getUserId()}`;

    // --- State ---
    const [progress, setProgress] = useState(0); 
    const [isCompleted, setIsCompleted] = useState(false);
    const [display, setDisplay] = useState('');
    const [currentResult, setCurrentResult] = useState(null);
    const [message, setMessage] = useState('Enter an expression using only working keys.');
    const [score, setScore] = useState(0); 

    // --- LOGIC TO RESET PROGRESS AND SCORE ON EVERY ENTRY ---
    useEffect(() => {
        // 1. Retrieve the entire user-specific progress object
        const storedProgress = JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || {};
        
        // 2. Reset the score/progress for THIS specific game to 0
        storedProgress['broken-calc'] = { title: 'Broken Calculator', progress: 0, score: 0 };
        
        // 3. Save the reset object back using the user-specific key
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(storedProgress));

        setProgress(0);
        setIsCompleted(false);
    }, []);
    // -------------------------------------------------------------
    
    // --- Handlers (Simplified for brevity, calculation logic remains the same) ---

    const handleButtonClick = (value) => {
        if (isCompleted) return;
        
        if (['+', '-', '*'].includes(value) && display.length === 0) return;
        const lastChar = display.slice(-1);
        if (['+', '-', '*'].includes(value) && ['+', '-', '*'].includes(lastChar)) {
            setDisplay(display.slice(0, -1) + value);
        } else {
            setDisplay(display + value);
        }
        setMessage('Keep going...');
        const newProgress = Math.min(99, display.length * 10);
        setProgress(newProgress);
    };

    const handleCalculate = () => {
        if (isCompleted) return;
        if (display.length === 0) {
            setMessage("Expression cannot be empty.");
            return;
        }

        try {
            // eslint-disable-next-line no-new-func
            const result = new Function('return ' + display)();
            
            setCurrentResult(result);

            if (result === TARGET_NUMBER) {
                completeGame(result);
            } else {
                setMessage(`Result: ${result}. Try again! Target is ${TARGET_NUMBER}.`);
            }
        } catch (error) {
            setMessage("Invalid expression! Check your syntax.");
            setCurrentResult('ERROR');
        }
    };

    const handleClear = () => {
        setDisplay('');
        setCurrentResult(null);
        setMessage('Enter an expression using only working keys.');
    };

    const completeGame = (finalResult) => {
        setProgress(100);
        setIsCompleted(true);
        const finalScore = 100; 
        setScore(finalScore);
        
        setMessage(`Success! ${display} = ${finalResult}. Puzzle solved!`);

        // --- SAVE using the user-specific key ---
        const storedProgress = JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || {};
        storedProgress['broken-calc'] = { title: 'Broken Calculator', progress: 100, score: finalScore };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(storedProgress));
    };
    
    const handleReturnHome = () => {
        navigate('/');
    };

    // --- Render Logic (Same as before) ---
    const renderButton = (value, isDisabled = false) => (
        <button 
            key={value}
            onClick={() => handleButtonClick(value)}
            disabled={isDisabled || isCompleted}
            className={`calc-button ${isDisabled ? 'broken' : 'working'}`}
        >
            {value}
        </button>
    );

    return (
        <div className="game-page-container">
            <h2>Broken Calculator 💻</h2>
            <ProgressBar percent={progress} label="Your Game Progress" />
            <p className="target-info">
                **Target Number:** **{TARGET_NUMBER}**
            </p>

            <div className="game-area">
                <p>{message}</p>
                
                <div className="calculator-ui">
                    <div className="display">
                        <div className="current-expression">{display || '0'}</div>
                        {currentResult !== null && <div className="result">{currentResult}</div>}
                    </div>

                    <div className="keypad">
                        {WORKING_KEYS.map(key => renderButton(key))}
                        {BROKEN_KEYS.map(key => renderButton(key, true))}

                        <button onClick={handleClear} className="calc-button special" disabled={isCompleted}>C</button>
                        <button onClick={handleCalculate} className="calc-button equals" disabled={isCompleted || display.length === 0}>=</button>
                    </div>
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
                    <p>Your Completion Code is: <strong>{FINAL_CODE}</strong></p>
                    <p>Remember this code!</p>
                </div>
            )}
        </div>
    );
}

export default BrokenCalculator;