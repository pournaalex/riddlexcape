import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../components/ProgressBar';

// --- CONFIG ---
const GAME_ID = 'mirror-typing';
const FINAL_CODE = "SEATS4U"; 
const ACCESS_CODE_FROM = "R3V3RB";

// The required input that results in "ECHO"
const CORRECT_REVERSED_INPUT = "OHCE"; 
const RIDDLE = "SEVLA EES TUOHTIW, SEVLA SEES TI. YLLAUSIV TIHSGNIUGNITSID NAC UOY NEHW SUTATS YM YDUTS.";

function MirrorTyping(props) {
    const { username, isGameOver, completeGame, timeRemaining, formatTime } = props;
    
    const navigate = useNavigate(); 
    const USER_STORAGE_KEY = `riddlescapeProgress_${username}`; 

    const [progress, setProgress] = useState(0); 
    const [isCompleted, setIsCompleted] = useState(false);
    const [rawInput, setRawInput] = useState('');
    const [displayedText, setDisplayedText] = useState('');
    const [message, setMessage] = useState('Type the reversed answer to the riddle.');
    const [score, setScore] = useState(0); 

    // --- EFFECT 1: Redirect on Time Out ---
    useEffect(() => {
        if (isGameOver) {
            navigate('/');
        }
    }, [isGameOver, navigate]);

    // --- EFFECT 2: Reset on Entry ---
    useEffect(() => {
        if (!username) { 
            navigate('/'); 
            return;
        }
        
        const storedProgress = JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || {};
        storedProgress[GAME_ID] = { title: 'Mirror Typing', progress: 0, score: 0 };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(storedProgress));

        setProgress(0);
        setIsCompleted(false);
        setMessage('Type the reversed answer to the riddle.');
    }, [USER_STORAGE_KEY, username]);
    
    // --- Core Mirror Typing Logic ---
    const handleInputChange = (e) => {
        const input = e.target.value.toUpperCase();
        setRawInput(input);
        
        // Reverse the input string for display
        const reversed = input.split('').reverse().join('');
        setDisplayedText(reversed);
        
        // Check for progress based on matching the required length
        const newProgress = Math.min(99, (input.length / CORRECT_REVERSED_INPUT.length) * 100);
        setProgress(newProgress);
    };
    
    // --- Submission Handler ---
    const handleSubmit = () => {
        if (isCompleted || isGameOver) return;
        
        if (rawInput.toUpperCase() === CORRECT_REVERSED_INPUT) {
            completeGameAction();
        } else {
            setMessage(`Incorrect. The displayed text is: ${displayedText}. Keep trying!`);
        }
    };

    const completeGameAction = () => {
        // Step 1: Set local state to completed
        setProgress(100);
        setIsCompleted(true);
        const finalScore = 100; 
        setScore(finalScore);
        
        setMessage(`SUCCESS! Answer: ECHO. Proceed to the next step!`);

        // Step 2: Update global App state to mark game as done
        completeGame(GAME_ID); 

        // Step 3: Update local storage for score/progress tracking
        const storedProgress = JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || {};
        storedProgress[GAME_ID] = { title: 'Mirror Typing', progress: 100, score: finalScore };
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
        <div className="game-page-container" style={{position: 'relative'}}>
            {renderTimer()} 
            <h2>Mirror Typing 🔄</h2>
            <p className="user-note">
                <span style={{color: 'var(--accent-glow)'}}>ACCESS CODE: {ACCESS_CODE_FROM}</span>
            </p>
            <ProgressBar percent={progress} label="Your Game Progress" />
            
            <div className="game-area">
                <p>
                    **Riddle:** {RIDDLE}
                </p>
                <p className={isGameOver ? 'error-message' : ''}>{isGameOver ? 'TIME IS UP! Go back to Home.' : message}</p>
                
                <div className="typing-area" style={{marginTop: '25px'}}>
                    
                    <div className="display-box" style={{
                        backgroundColor: '#000', 
                        color: 'var(--accent-glow)', 
                        fontFamily: 'var(--font-digital)',
                        fontSize: '2em',
                        padding: '10px',
                        border: '2px solid var(--border-glow)',
                        marginBottom: '15px',
                        textAlign: 'center',
                        height: '60px'
                    }}>
                        {displayedText || '...OUTPUT...'}
                    </div>

                    <input
                        type="text"
                        placeholder="Type here..."
                        value={rawInput}
                        onChange={handleInputChange}
                        disabled={isDisabled}
                        maxLength={CORRECT_REVERSED_INPUT.length}
                        style={{padding: '10px', width: '100%', textAlign: 'center', backgroundColor: '#20023a', color: 'var(--text-primary)', border: '1px solid var(--border-glow)', fontSize: '1.2em'}}
                    />
                    
                    <button 
                        onClick={handleSubmit} 
                        disabled={isDisabled || rawInput.length !== CORRECT_REVERSED_INPUT.length}
                        className="calc-button working" 
                        style={{marginTop: '15px', width: '100%'}}
                    >
                        Submit Answer
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
                    <h3>🎉 Challenge Complete! (Score: 100)</h3>
                 
                    <p>Go back to home to finish the game!</p>
                </div>
            )}
        </div>
    );
}

export default MirrorTyping;