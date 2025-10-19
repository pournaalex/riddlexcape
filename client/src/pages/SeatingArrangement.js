import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../components/ProgressBar';

// --- CONFIG ---
const GAME_ID = 'seating-arrangement';
const FINAL_CODE = "RIDDLE-MASTER-5"; 
const ACCESS_CODE_FROM = "SEATS4U"; // Access code from Mirror Typing

const QUESTION = "Five friends are sitting in a row. Anna is to the left of Bob but to the right of Carol. Dave is to the right of Bob. Emily is between Bob and Dave. Who is sitting at the far left?";
const ANSWER_OPTIONS = "a) Anna, b) Bob, c) Carol, d) Dave.";
// Correct solution is Carol (C A B E D)
const CORRECT_ANSWER = 'CAROL'; 

function SeatingArrangement(props) {
    const { username, isGameOver, completeGame, timeRemaining, formatTime } = props;
    
    const navigate = useNavigate(); 
    const USER_STORAGE_KEY = `riddlescapeProgress_${username}`; 

    const [progress, setProgress] = useState(0); 
    const [isCompleted, setIsCompleted] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [message, setMessage] = useState('Type the name of the person sitting at the far left.');
    const [score, setScore] = useState(0); 
    
    // --- EFFECT 1: Redirect on Time Out ---
    useEffect(() => {
        if (isGameOver) {
            navigate('/');
        }
    }, [isGameOver, navigate]);

    // --- EFFECT 2: Reset on Entry ---
    useEffect(() => {
        if (!username) return; 

        const storedProgress = JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || {};
        storedProgress[GAME_ID] = { title: 'Seating Arrangement', progress: 0, score: 0 };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(storedProgress));

        setProgress(0);
        setIsCompleted(false);
        setTextInput('');
        setMessage('Type the name of the person sitting at the far left.');
    }, [USER_STORAGE_KEY, username]);
    
    // --- Submission Handler ---
    const handleSubmit = () => {
        if (isCompleted || isGameOver || !textInput) return;
        
        const submittedAnswer = textInput.toUpperCase().trim();
        setProgress(50);
        
        if (submittedAnswer === CORRECT_ANSWER) {
            completeGameAction();
        } else {
            setMessage(`Incorrect name entered. Review the clues carefully!`);
        }
    };
    
    // --- Input Change Handler ---
    const handleInputChange = (e) => {
        setTextInput(e.target.value);
        // Update progress based on input length (simple visual feedback)
        setProgress(Math.min(99, e.target.value.length * 15));
    };


    const completeGameAction = () => {
        setProgress(100);
        setIsCompleted(true);
        const finalScore = 100; 
        setScore(finalScore);
        
        setMessage(`SUCCESS! The far-left person is Carol.`);

        completeGame(GAME_ID); 

        const storedProgress = JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || {};
        storedProgress[GAME_ID] = { title: 'Seating Arrangement', progress: 100, score: finalScore };
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
            <h2>Seating Arrangement Puzzle 👥</h2>
            <p className="user-note">
                <span style={{color: 'var(--accent-glow)'}}>ACCESS CODE: {ACCESS_CODE_FROM}</span>
            </p>
            <ProgressBar percent={progress} label="Your Game Progress" />
            
            <div className="game-area">
                <p style={{marginBottom: '20px', fontWeight: 'bold'}}>{QUESTION}</p>
                <p style={{marginBottom: '20px', color: 'var(--text-secondary)'}}>{ANSWER_OPTIONS}</p>
                
                <p className={isGameOver ? 'error-message' : ''}>{isGameOver ? 'TIME IS UP! Go back to Home.' : message}</p>
                
                <div className="input-area" style={{margin: '20px auto', maxWidth: '300px'}}>
                    <input
                        type="text"
                        placeholder="Enter Name Here"
                        value={textInput}
                        onChange={handleInputChange}
                        disabled={isDisabled}
                        style={{padding: '12px', width: '100%', textAlign: 'center', backgroundColor: '#20023a', color: 'var(--text-primary)', border: '1px solid var(--border-glow)', fontSize: '1.2em', borderRadius: '4px'}}
                    />
                </div>

                <button 
                    onClick={handleSubmit} 
                    disabled={isDisabled || !textInput}
                    className="submit-button submit-success" 
                    style={{marginTop: '10px', width: '100%', maxWidth: '300px'}}
                >
                    Submit Answer
                </button>
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
                    <p>Go back to home to submit your score!</p>
                </div>
            )}
        </div>
    );
}

export default SeatingArrangement;