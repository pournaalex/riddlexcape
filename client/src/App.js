import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import BrokenCalculator from './pages/BrokenCalculator';
import PaintedCubeChallenge from './pages/PaintedCubeChallenge';
import InvisibleMaze from './pages/InvisibleMaze';
import MirrorTyping from './pages/MirrorTyping'; // NEW IMPORT
import SeatingArrangement from './pages/SeatingArrangement';

// --- CONFIGURATION ---
const MAX_TIME_MINUTES = 15;
// ADD THE NEW GAME ID
const GAME_IDS = ['broken-calc', 'painted-cube', 'invisible-maze', 'mirror-typing']; 

function App() {
    const navigate = useNavigate(); 
    
    // --- STATE SETUP ---
    const [username, setUsername] = useState('');
    const [timeRemaining, setTimeRemaining] = useState(MAX_TIME_MINUTES * 60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    
    // Tracks completion state
    const [gameCompletion, setGameCompletion] = useState(
        GAME_IDS.reduce((acc, id) => ({ ...acc, [id]: false }), {})
    );
    const [isGameOver, setIsGameOver] = useState(false);
    const [startTime, setStartTime] = useState(null);
    
    const allGamesComplete = Object.values(gameCompletion).every(status => status === true);

    // Helper to format time (e.g., 14:59)
    const formatTime = (totalSeconds) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // --- TIMER EFFECT (Stops on isGameOver=true) ---
    useEffect(() => {
        if (!isTimerRunning || isGameOver) return;

        const timer = setInterval(() => {
            setTimeRemaining(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timer);
                    setIsGameOver(true);
                    navigate('/'); // Auto-submit/game over redirect
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isTimerRunning, isGameOver, navigate]);

    // --- GAME COMPLETE EFFECT (Stop timer when done) ---
    useEffect(() => {
        if (allGamesComplete && isTimerRunning) {
            setIsGameOver(true);
            setIsTimerRunning(false); // Immediately stop the timer loop
        }
    }, [allGamesComplete, isTimerRunning, setIsGameOver, setIsTimerRunning]);

    // Function to start the game/timer
    const startRiddlescape = (name) => {
        setGameCompletion(
             GAME_IDS.reduce((acc, id) => ({ ...acc, [id]: false }), {})
        );
        setUsername(name);
        setIsTimerRunning(true);
        setStartTime(Date.now());
        setTimeRemaining(MAX_TIME_MINUTES * 60);
    };

    // Function passed down to game pages to mark completion
    const completeGame = useCallback((gameId) => {
        setGameCompletion(prev => ({
            ...prev,
            [gameId]: true
        }));
    }, []);

    // Function to calculate time taken for submission
    const calculateTotalTime = () => {
        if (!startTime) return "N/A";
        const endTime = isGameOver ? startTime + (MAX_TIME_MINUTES * 60 * 1000) - (timeRemaining * 1000) : Date.now();
        const elapsedSeconds = Math.round((endTime - startTime) / 1000);
        
        return formatTime(elapsedSeconds);
    };
    
    // Global context state (passed as props)
    const globalState = {
        username, setUsername, timeRemaining, formatTime, isTimerRunning, startRiddlescape,
        isGameOver, allGamesComplete, completeGame, GAME_IDS, calculateTotalTime,
        MAX_TIME_MINUTES, gameCompletion, setIsTimerRunning, setIsGameOver, setTimeRemaining
    };

    return (
        <div className="app">
            <Routes>
                <Route path="/" element={<Home {...globalState} />} />
                
                {/* Existing Game Route 1 */}
                <Route path="/broken-calc" element={<BrokenCalculator {...globalState} gameId="broken-calc" />} />
                
                {/* Existing Game Route 2 */}
                <Route path="/painted-cube" element={<PaintedCubeChallenge {...globalState} gameId="painted-cube" />} />
                
                {/* Existing Game Route 3 */}
                <Route path="/invisible-maze" element={<InvisibleMaze {...globalState} gameId="invisible-maze" />} />
                
                {/* NEW GAME ROUTE 4 */}
                <Route path="/mirror-typing" element={<MirrorTyping {...globalState} gameId="mirror-typing" />} />
               <Route path="/seating-arrangement" element={<SeatingArrangement {...globalState} gameId="seating-arrangement" />} />
            </Routes>
        </div>
    );
}

export default App;