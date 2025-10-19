import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../components/ProgressBar';

// --- CONFIG ---
const GAME_ID = 'broken-calc';

const KEY_LIMITS = {
    1: 1,   
    2: 2,   
    5: 3,   
    '+': 0, 
    '-': 3, 
    '*': 2, 
};
const FINAL_CODE = "BETA"; 
const TARGET_NUMBER = 42;
const ALL_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0, '+', '-', '*', '/'];

// Helper function to check if a key is intended to be broken based on limits
const isStandardBrokenKey = (key) => KEY_LIMITS[key] === undefined && [3, 4, 6, 7, 8, 9, 0, '/'].includes(key);

function BrokenCalculator(props) {
    const { username, isGameOver, completeGame, timeRemaining, formatTime } = props; 
    
    const navigate = useNavigate(); 
    
    // --- Defensive Check: If no username, abort rendering immediately ---
    if (!username) {
        navigate('/');
        return null; 
    }
    // The component WILL NOT RENDER PAST THIS POINT unless 'username' is truthy.
    
    // --- Storage Key is NOW SAFE to define ---
    const USER_STORAGE_KEY = `riddlescapeProgress_${username}`; 

    const [progress, setProgress] = useState(0); 
    const [isCompleted, setIsCompleted] = useState(false);
    const [display, setDisplay] = useState('');
    const [currentResult, setCurrentResult] = useState(null);
    const [message, setMessage] = useState('Enter an expression. Limited uses apply!');
    const [score, setScore] = useState(0); 
    // State initialization is now safe because 'KEY_LIMITS' is a static object.
    const [usageCount, setUsageCount] = useState(KEY_LIMITS); 

    // --- EFFECT 1: Redirect on Time Out ---
    useEffect(() => {
        if (isGameOver) {
            navigate('/');
        }
    }, [isGameOver, navigate]);
    
    // --- EFFECT 2: Reset on Entry ---
    // Note: All dependencies here are stable now that we have the initial null check.
    useEffect(() => {
        
        const storedProgress = localStorage.getItem(USER_STORAGE_KEY);
        let reset = true;
        
        // This logic prevents the infinite loop/crash by ensuring the reset only happens once per mount
        if (storedProgress) {
            try {
                const parsed = JSON.parse(storedProgress);
                // If the game is already complete in storage, we shouldn't reset, but force the reset anyway for a new attempt.
                reset = true; 
            } catch (e) {
                console.error("Storage error on load:", e);
            }
        }
        
        if (reset) {
            const storedProgress = JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || {};
            storedProgress[GAME_ID] = { title: 'Broken Calculator', progress: 0, score: 0 };
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(storedProgress));

            setProgress(0);
            setIsCompleted(false);
            setUsageCount(KEY_LIMITS); 
            setDisplay('');
            setCurrentResult(null);
            setMessage('Enter an expression. Limited uses apply!');
        }

    }, [USER_STORAGE_KEY]);
    
    // --- Handlers ---
    
    const handleButtonClick = (value) => {
        if (isCompleted || isGameOver) return;
        
        const stringValue = String(value);

        if (KEY_LIMITS[stringValue] === 0) { 
            setMessage(`Key '${stringValue}' is disabled.`);
            return;
        }

        if (usageCount[stringValue] !== undefined) {
            if (usageCount[stringValue] <= 0) {
                setMessage(`Cannot use '${stringValue}'. Limit reached!`);
                return;
            }
        }
        
        // Standard Calculation Logic 
        if (['+', '-', '*'].includes(stringValue) && display.length === 0) return;
        const lastChar = display.slice(-1);
        if (['+', '-', '*'].includes(stringValue) && ['+', '-', '*'].includes(lastChar)) {
            setDisplay(display.slice(0, -1) + stringValue);
        } else {
            setDisplay(display + stringValue);
        }
        
        // Update Usage Count
        if (usageCount[stringValue] !== undefined) {
            setUsageCount(prevCount => ({
                ...prevCount,
                [stringValue]: prevCount[stringValue] - 1
            }));
        }

        setMessage('Keep going...');
        const newProgress = Math.min(99, display.length * 10);
        setProgress(newProgress);
    };

    const handleCalculate = () => {
        if (isCompleted || isGameOver) return;
        if (display.length === 0) {
            setMessage("Expression cannot be empty.");
            return;
        }

        try {
            // eslint-disable-next-line no-new-func
            const result = new Function('return ' + display)();
            
            setCurrentResult(result);

            if (result === TARGET_NUMBER) {
                completeGameAction(result);
            } else {
                setMessage(`Result: ${result}. Try again! Target is ${TARGET_NUMBER}.`);
            }
        } catch (error) {
            setMessage("Invalid expression! Check your syntax.");
            setCurrentResult('ERROR');
        }
    };

    const handleClear = () => {
        if (isGameOver) return;
        setDisplay('');
        setCurrentResult(null);
        setMessage('Enter an expression. Limited uses apply!');
        setUsageCount(KEY_LIMITS); 
    };

    const completeGameAction = (finalResult) => {
        setProgress(100);
        setIsCompleted(true);
        const finalScore = 100; 
        setScore(finalScore);
        
        setMessage(`Success! ${display} = ${finalResult}. Puzzle solved!`);

        completeGame(GAME_ID); 

        const storedProgress = JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || {};
        storedProgress[GAME_ID] = { title: 'Broken Calculator', progress: 100, score: finalScore };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(storedProgress));
    };
    
    const handleReturnHome = () => {
        navigate('/');
    };

    // --- Render Logic ---
    
    const renderTimer = () => (
        <div className="timer-display-game">
            <span className={timeRemaining <= 60 ? 'timer-critical' : 'timer-normal'}>
                {formatTime(timeRemaining)}
            </span>
        </div>
    );


    const renderButton = (value) => {
        const stringValue = String(value);
        const remainingUses = usageCount[stringValue];
        
        const isBrokenOrDisabled = isStandardBrokenKey(value) || KEY_LIMITS[stringValue] === 0;

        const isLimitReached = remainingUses !== undefined && remainingUses <= 0;
        const buttonDisabled = isCompleted || isGameOver || isLimitReached || isBrokenOrDisabled;

        const label = stringValue; 

        const buttonClass = isBrokenOrDisabled
            ? 'broken' 
            : (isLimitReached ? 'exhausted' : 'working');

        return (
            <button 
                key={stringValue}
                onClick={() => handleButtonClick(value)}
                disabled={buttonDisabled}
                className={`calc-button ${buttonClass}`}
            >
                {label}
                {/* Render usage count only if it's a working/limited key */}
                {remainingUses !== undefined && (
                    <span className="usage-count">{remainingUses}</span>
                )}
            </button>
        );
    }
    
    return (
        <div className="game-page-container">
            {renderTimer()} 
            <h2>Broken Calculator 💻</h2>
            <p className="user-note">
                <span style={{color: 'var(--accent-glow)'}}>TARGET: {TARGET_NUMBER}</span>. Code to next game: **{FINAL_CODE}**
            </p>
            <ProgressBar percent={progress} label="Your Game Progress" />
            
            <div className="game-area">
                <p className={isGameOver ? 'error-message' : ''}>{isGameOver ? 'TIME IS UP! Go back to Home.' : message}</p>
                
                <div className="calculator-ui">
                    <div className="display">
                        <div className="current-expression">{display || '0'}</div>
                        {currentResult !== null && <div className="result">{currentResult}</div>}
                    </div>

                    <div className="keypad">
                        {/* ROW 1: 7, 8, 9, / */}
                        {renderButton(7)}
                        {renderButton(8)}
                        {renderButton(9)}
                        {renderButton('/')}

                        {/* ROW 2: 4, 5, 6, * */}
                        {renderButton(4)}
                        {renderButton(5)}
                        {renderButton(6)}
                        {renderButton('*')}
                        
                        {/* ROW 3: 1, 2, 3, - */}
                        {renderButton(1)}
                        {renderButton(2)}
                        {renderButton(3)}
                        {renderButton('-')}

                        {/* ROW 4: 0, C, =, + (Special layout) */}
                        {renderButton(0)}
                        <button onClick={handleClear} className="calc-button special" disabled={isCompleted || isGameOver}>C</button>
                        <button onClick={handleCalculate} className="calc-button equals" disabled={isCompleted || isGameOver || display.length === 0}>=</button>
                        {renderButton('+')}
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
                    <p>Go back to home to submit your final time!</p>
                </div>
            )}
        </div>
    );
}

export default BrokenCalculator;