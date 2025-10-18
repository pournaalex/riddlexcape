import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../components/ProgressBar';

// --- CONFIG ---
const GAME_ID = 'broken-calc';

// Adjusted limits to allow a feasible solution (e.g., (5 * 5 * 2) - 5 - 2 - 1 = 42)
const KEY_LIMITS = {
    1: 1,   // Key '1' must be used exactly 1 time
    2: 2,   // Key '2' must be used exactly 2 times
    5: 3,   // Key '5' must be used exactly 3 times
    '+': 0, // Operator '+' disabled
    '-': 3, // Operator '-' must be used twice
    '*': 2, // Operator '*' must be used twice
};
const WORKING_KEYS = [1, 2, 5, '+', '-', '*']; 
const BROKEN_KEYS = [3, 4, 6, 7, 8, 9, 0, '/']; 
const FINAL_CODE = "MATH-WIZ-BEEP"; 
const TARGET_NUMBER = 42;


function BrokenCalculator(props) {
    const { username, isGameOver, completeGame } = props;
    const navigate = useNavigate(); 
    const USER_STORAGE_KEY = `riddlescapeProgress_${username}`; 

    const [progress, setProgress] = useState(0); 
    const [isCompleted, setIsCompleted] = useState(false);
    const [display, setDisplay] = useState('');
    const [currentResult, setCurrentResult] = useState(null);
    const [message, setMessage] = useState('Enter an expression. Limited uses apply!');
    const [score, setScore] = useState(0); 
    const [usageCount, setUsageCount] = useState(KEY_LIMITS);

    // --- LOGIC TO RESET PROGRESS AND SCORE ON EVERY ENTRY ---
    useEffect(() => {
        if (!username) { 
            navigate('/'); 
            return;
        }
        
        const storedProgress = JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || {};
        storedProgress[GAME_ID] = { title: 'Broken Calculator', progress: 0, score: 0 };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(storedProgress));

        setProgress(0);
        setIsCompleted(false);
        setUsageCount(KEY_LIMITS); // Reset usage counts
        setDisplay('');
        setCurrentResult(null);
        setMessage('Enter an expression. Limited uses apply!');

    }, [username, USER_STORAGE_KEY]);
    
    // --- Handlers ---
    
    const handleButtonClick = (value) => {
        if (isCompleted || isGameOver) return;
        
        const stringValue = String(value);

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
        setUsageCount(KEY_LIMITS); // Reset all usage counts to limits!
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

    const renderButton = (value, isDisabled = false) => {
        const stringValue = String(value);
        const remainingUses = usageCount[stringValue];
        
        const isLimitReached = remainingUses !== undefined && remainingUses <= 0;
        const buttonDisabled = isDisabled || isCompleted || isGameOver || isLimitReached;

        const label = stringValue; 

        const buttonClass = isDisabled 
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
                {/* Render usage count as a small floating span for aesthetics */}
                {remainingUses !== undefined && (
                    <span className="usage-count">{remainingUses}</span>
                )}
            </button>
        );
    }
    
    const isDisabled = isCompleted || isGameOver;

    return (
        <div className="game-page-container">
            <h2>Broken Calculator 💻</h2>
            <p className="user-note">
                <span style={{color: 'var(--accent-glow)'}}>TARGET: {TARGET_NUMBER}</span>. Use each key wisely!
            </p>
            <ProgressBar percent={progress} label="Your Game Progress" />
            
            <div className="game-area">
                <p className={isGameOver ? 'error-message' : ''}>{isGameOver ? 'TIME IS UP! Go back to Home.' : message}</p>
                
                <div className="calculator-ui">
                    <div className="display">
                        <div className="current-expression">{display || '0'}</div>
                        {currentResult !== null && <div className="result">{currentResult}</div>}
                    </div>

                    {/* NEW KEYPAD STRUCTURE FOR CSS GRID COMPATIBILITY */}
                    <div className="keypad">
                        {/* Row 1: 7, 8, 9, / (All broken) */}
                        {BROKEN_KEYS.slice(2, 6).map(key => renderButton(key, true))} 
                        
                        {/* Row 2: 4, 6, * (4 and 6 broken, * working) */}
                        {BROKEN_KEYS.slice(0, 2).map(key => renderButton(key, true))} 
                        {renderButton('*', false)}
                        {renderButton('-', false)}
                        
                        {/* Row 3: 1, 2, 5, + (All working) */}
                        {WORKING_KEYS.filter(k => [1, 2, 5].includes(k)).map(key => renderButton(key, false))}
                        {renderButton('+', false)}

                        {/* Row 4: 3, 0, C, = (3, 0 broken) */}
                        {BROKEN_KEYS.slice(6, 8).map(key => renderButton(key, true))} 
                        <button onClick={handleClear} className="calc-button special" disabled={isDisabled}>C</button>
                        <button onClick={handleCalculate} className="calc-button equals" disabled={isDisabled || display.length === 0}>=</button>
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