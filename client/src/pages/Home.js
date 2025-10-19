import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProgressBar from '../components/ProgressBar';

const API_BASE_URL = 'http://localhost:5000';

// Define the initial state structure with the new game
const INITIAL_GAME_PROGRESS = {
    'broken-calc': { title: 'Broken Calculator', progress: 0, score: 0 },
    'painted-cube': { title: 'Painted Cube Challenge', progress: 0, score: 0 },
    'invisible-maze': { title: 'Invisible Maze', progress: 0, score: 0 },
    'mirror-typing': { title: 'Mirror Typing', progress: 0, score: 0 } // NEW GAME
};

// Home component now receives global state props from App.js
function Home(props) {
    const { 
        username, setUsername, isTimerRunning, startRiddlescape, 
        timeRemaining, formatTime, isGameOver, allGamesComplete, 
        calculateTotalTime, GAME_IDS, gameCompletion,
        setIsTimerRunning, setIsGameOver, setTimeRemaining, MAX_TIME_MINUTES
    } = props;
    
    // --- LOCAL STATE ---
    const [accessCode, setAccessCode] = useState('');
    const [error, setError] = useState('');
    const [gameProgress, setGameProgress] = useState(INITIAL_GAME_PROGRESS);
    const [currentUsernameInput, setCurrentUsernameInput] = useState(username);
    const [submissionMessage, setSubmissionMessage] = useState(null);
    const navigate = useNavigate();

    // Memoize the score calculation outside of the component render cycle
    const calculateGameProgress = useCallback(() => {
        const storedProgressKey = username ? `riddlescapeProgress_${username}` : null;
        const storedProgress = storedProgressKey ? localStorage.getItem(storedProgressKey) : null;
        
        let currentProgress = INITIAL_GAME_PROGRESS;
        
        if (storedProgress) {
            try {
                const parsed = JSON.parse(storedProgress);
                currentProgress = { 
                    ...INITIAL_GAME_PROGRESS, 
                    ...parsed 
                };
            } catch (e) {
                console.error("Error parsing stored progress:", e);
                currentProgress = INITIAL_GAME_PROGRESS; 
            }
        }
        setGameProgress(currentProgress);
    }, [username]);

    // UseEffect to load/re-load scores ONLY when username is stable
    useEffect(() => {
        if (username) {
            calculateGameProgress();
        }
    }, [username, calculateGameProgress]); 

    // Calculate overall score and progress based on current state
    const totalScore = Object.values(gameProgress).reduce((sum, game) => sum + (game.score || 0), 0);
    const totalMaxScore = GAME_IDS.length * 100; // Adaptable to number of games
    const overallProgress = (totalScore / totalMaxScore) * 100;
    
    // --- Handlers ---
    
    const handleStartGame = (e) => {
        e.preventDefault();
        if (currentUsernameInput.trim() === '') {
            setError('Please enter a username.');
            return;
        }
        startRiddlescape(currentUsernameInput.trim());
        setCurrentUsernameInput(currentUsernameInput.trim());
        setError('');
    };

    const handleCodeSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!isTimerRunning) {
            setError("Start the game first by entering a username.");
            return;
        }
        
        try {
            const response = await axios.post(`${API_BASE_URL}/api/validate-code`, {
                code: accessCode
            });

            if (response.data.success) {
                navigate(response.data.route);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid Access Code.');
        }
        setAccessCode('');
    };
    
    // Function to completely reset the game state
    const handleFullReset = () => {
        if (window.confirm("Are you sure you want to reset the entire game? Your current score will not be submitted.")) {
            // 1. Reset GLOBAL state (in App.js)
            setIsTimerRunning(false);
            setIsGameOver(false);
            setTimeRemaining(MAX_TIME_MINUTES * 60);
            setUsername('');
            
            // 2. Reset LOCAL state (in Home.js)
            setSubmissionMessage(null);
            setAccessCode('');
            setError('');
            setCurrentUsernameInput('');
            setGameProgress(INITIAL_GAME_PROGRESS); 
        }
    };
    
    const handleSubmitScore = async () => {
        setSubmissionMessage('Submitting...');
        
        const timeTaken = calculateTotalTime();
        
        try {
            const response = await axios.post(`${API_BASE_URL}/api/submit-score`, {
                username: username,
                totalTime: timeTaken,
                finalScore: totalScore
            });
            
            if (response.data.success) {
                setSubmissionMessage(`Success! Finished in ${timeTaken}. Your score is recorded.`);
                
                // Clear state for a new run immediately after submission success
                setIsTimerRunning(false);
                setIsGameOver(false);
                setTimeRemaining(MAX_TIME_MINUTES * 60);
                setUsername('');
                
                setSubmissionMessage(null);
            }
        } catch (error) {
            setSubmissionMessage('Submission failed. Check API connection and restart server if necessary.');
        }
    };


    // --- Render Logic ---
    
    const renderTimer = () => (
        <div className="timer-display">
            <h2>Time Remaining: <span className={timeRemaining <= 60 ? 'timer-critical' : 'timer-normal'}>{formatTime(timeRemaining)}</span></h2>
        </div>
    );
    
    const renderSubmissionButton = () => {
        if (!isGameOver && !allGamesComplete) return null; 
        
        // Determine the reason for submission prompt
        let reason = '';
        if (allGamesComplete) {
            reason = 'All puzzles solved! Submit your score now.';
        } else if (isGameOver) {
            reason = 'Time limit reached! Submit final score.';
        }

        const statusMessage = allGamesComplete 
            ? 'SUBMIT Final Score' 
            : 'TIME IS UP! SUBMIT';
            
        return (
            <div className="submit-section">
                <p className="submission-prompt">{reason}</p>
                <button 
                    onClick={handleSubmitScore} 
                    className={`submit-button ${allGamesComplete ? 'submit-success' : 'submit-timeup'}`}
                    disabled={submissionMessage !== null && submissionMessage.startsWith('Submitting')}
                >
                    {statusMessage}
                </button>
                {submissionMessage && <p className="submission-message">{submissionMessage}</p>}
                <p className="time-taken">
                    Total Time Elapsed: <strong>{calculateTotalTime()}</strong>
                </p>
            </div>
        );
    };


    if (!isTimerRunning && !isGameOver) {
        // --- Username Input Screen ---
        return (
            <div className="home-container start-screen">
                <h1>RiddlEscape 🔑</h1>
                <h2>Welcome, Agent. You have {MAX_TIME_MINUTES} minutes to solve the puzzles.</h2>
                <form onSubmit={handleStartGame} className="code-entry-form" style={{ marginTop: '50px' }}>
                    <input
                        type="text"
                        placeholder="Enter your Agent Username"
                        value={currentUsernameInput}
                        onChange={(e) => setCurrentUsernameInput(e.target.value)}
                        disabled={isTimerRunning}
                    />
                    <button type="submit" disabled={isTimerRunning}>START ESCAPE</button>
                    {error && <p className="error-message">{error}</p>}
                </form>
            </div>
        );
    }
    
    // --- Game In Progress Screen ---
    return (
        <div className="home-container">
            {renderTimer()}
            <p className="user-id-display">Agent: {username}</p>
            <div className="score-tracker">
                <h2>Total Score: {totalScore} Points</h2>
                <ProgressBar percent={overallProgress} label="Overall Progress" />
            </div>

            <form onSubmit={handleCodeSubmit} className="code-entry-form">
                <input
                    type="text"
                    placeholder="Enter Game Access Code"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    disabled={isGameOver || allGamesComplete}
                />
                <button type="submit" disabled={isGameOver || allGamesComplete}>Unlock Game</button>
                {error && <p className="error-message">{error}</p>}
            </form>

            {/* Submission Button */}
            {renderSubmissionButton()}

            {/* Always show the Reset Button if the game is over or solved */}
            {(isGameOver || allGamesComplete) && (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button onClick={handleFullReset} className="reset-button">
                        Start New RiddlEscape 🔄
                    </button>
                </div>
            )}


            <div className="game-list">
                <h3>Game Status:</h3>
                {Object.entries(gameProgress).map(([key, game]) => (
                    <div key={key} className="game-card">
                        <h4>{game.title} - {gameCompletion[key] ? 'SOLVED' : 'LOCKED'}</h4>
                        <ProgressBar percent={game.progress} label="Completion Status" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Home;