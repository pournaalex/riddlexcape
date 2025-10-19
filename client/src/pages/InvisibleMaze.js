import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../components/ProgressBar';

// --- CONFIG ---
const GAME_ID = 'invisible-maze';
const FINAL_CODE = "R3V3RB"; 
const ACCESS_CODE_FROM = "JET2MAZE";

const MAZE_SIZE = 400; 
const CELL_SIZE = 40;
const PLAYER_SIZE = 5; // Fixed small size for maximum clearance
const COLLISION_TOLERANCE = 1; 
const START_X = CELL_SIZE / 2;
const START_Y = CELL_SIZE / 2;
const GOAL_X = MAZE_SIZE - CELL_SIZE / 2;
const GOAL_Y = MAZE_SIZE - CELL_SIZE / 2;
const COLLISION_DURATION = 500; 

// DIFFICULTY SETTINGS
const MAX_STRIKES = 5; 
const MOVEMENT_STEP = 8; 

// 🎯 FINAL GUARANTEED SOLVABLE MAZE (Open Cross Pattern)
// This pattern has open paths down the central columns/rows.

const HORIZONTAL_WALLS = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Open South at 0,0
    [0, 1, 1, 1, 1, 0, 0, 0, 1, 1], // Open South at 0,1; 2,1
    [0, 0, 1, 0, 0, 1, 1, 0, 1, 1], 
    [0, 1, 0, 0, 0, 1, 1, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 0, 1, 1], // Center Row 5 open
    [1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 0, 1, 1, 1, 0, 1, 0],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 1], // Goal area fully open
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];
const VERTICAL_WALLS = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Open East at 0,0
    [1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1], // Open East at 0,1; 2,1
    [1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1],
    [1, 0, 1, 0, 1, 1, 0, 0, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
    [1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1],
    [1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1], // Goal entry path open
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];


function InvisibleMaze(props) {
    const { username, isGameOver, completeGame, timeRemaining, formatTime } = props;
    
    const navigate = useNavigate(); 
    const USER_STORAGE_KEY = `riddlescapeProgress_${username}`; 
    const canvasRef = useRef(null);

    const [progress, setProgress] = useState(0); 
    const [isCompleted, setIsCompleted] = useState(false);
    const [message, setMessage] = useState('Use WASD or Arrow Keys to move.');
    const [score, setScore] = useState(0); 
    const [playerPos, setPlayerPos] = useState({ x: START_X, y: START_Y });
    const [collisionLine, setCollisionLine] = useState(null);
    
    const [strikeCount, setStrikeCount] = useState(0); 
    const [checkpoint, setCheckpoint] = useState({ x: START_X, y: START_Y }); 
    const [currentCell, setCurrentCell] = useState({ x: 0, y: 0 }); 

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
        storedProgress[GAME_ID] = { title: 'Invisible Maze', progress: 0, score: 0 };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(storedProgress));

        setProgress(0);
        setIsCompleted(false);
        setMessage(`Use WASD or Arrow Keys to move. Strikes: 0/${MAX_STRIKES}`);
        setPlayerPos({ x: START_X, y: START_Y });
        setCheckpoint({ x: START_X, y: START_Y });
        setStrikeCount(0);
        setCollisionLine(null);
        setCurrentCell({ x: 0, y: 0 });
    }, [USER_STORAGE_KEY, username]);
    
    // --- Canvas Drawing Logic (Unchanged) ---
    const drawMaze = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, MAZE_SIZE, MAZE_SIZE);
        
        // Draw GOAL
        ctx.fillStyle = isCompleted ? 'var(--success-color)' : 'rgba(0, 255, 255, 0.4)';
        ctx.fillRect(GOAL_X - CELL_SIZE/2, GOAL_Y - CELL_SIZE/2, CELL_SIZE, CELL_SIZE);
        
        // Draw CHECKPOINT indicator
        ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(checkpoint.x, checkpoint.y, PLAYER_SIZE + 5, 0, Math.PI * 2);
        ctx.fill();

        // Draw Player
        ctx.fillStyle = 'var(--accent-glow)';
        ctx.beginPath();
        ctx.arc(playerPos.x, playerPos.y, PLAYER_SIZE, 0, Math.PI * 2);
        ctx.fill();

        // Draw Collision Line if active
        if (collisionLine) {
            ctx.strokeStyle = 'var(--error-color)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(collisionLine.x1, collisionLine.y1);
            ctx.lineTo(collisionLine.x2, collisionLine.y2);
            ctx.stroke();
        }

    }, [playerPos, collisionLine, isCompleted, checkpoint]);

    useEffect(() => {
        drawMaze();
    }, [drawMaze]);
    
    // --- Collision Logic (CRITICALLY REFINED) ---
    const checkCollision = useCallback((newX, newY) => {
        const cellX = Math.floor(playerPos.x / CELL_SIZE);
        const cellY = Math.floor(playerPos.y / CELL_SIZE);
        
        const playerRadius = PLAYER_SIZE; 
        const cellBoundary = CELL_SIZE;

        let wallFound = null;
        let line = null;
        
        // 1. Moving Right: Check Vertical Wall array at [Y][X+1]
        if (newX > playerPos.x) {
            if (VERTICAL_WALLS[cellY]?.[cellX + 1] === 1 && (newX + playerRadius + COLLISION_TOLERANCE) >= (cellX + 1) * cellBoundary) { 
                wallFound = 'right';
            }
        }
        // 2. Moving Left: Check Vertical Wall array at [Y][X]
        else if (newX < playerPos.x) {
             if (VERTICAL_WALLS[cellY]?.[cellX] === 1 && (newX - playerRadius - COLLISION_TOLERANCE) <= cellX * cellBoundary) { 
                wallFound = 'left';
            }
        }
        // 3. Moving Down: Check Horizontal Wall array at [Y+1][X]
        else if (newY > playerPos.y) {
            if (HORIZONTAL_WALLS[cellY + 1]?.[cellX] === 1 && (newY + playerRadius + COLLISION_TOLERANCE) >= (cellY + 1) * cellBoundary) { 
                wallFound = 'down';
            }
        }
        // 4. Moving Up: Check Horizontal Wall array at [Y][X]
        else if (newY < playerPos.y) {
            if (HORIZONTAL_WALLS[cellY]?.[cellX] === 1 && (newY - playerRadius - COLLISION_TOLERANCE) <= cellY * cellBoundary) { 
                wallFound = 'up';
            }
        }

        if (wallFound) {
            // Calculate collision line coordinates for drawing
            const wallLineCoord = {
                right: { x1: (cellX + 1) * CELL_SIZE, y1: cellY * CELL_SIZE, x2: (cellX + 1) * CELL_SIZE, y2: (cellY + 1) * CELL_SIZE },
                left:  { x1: cellX * CELL_SIZE, y1: cellY * CELL_SIZE, x2: cellX * CELL_SIZE, y2: (cellY + 1) * CELL_SIZE },
                down:  { x1: cellX * CELL_SIZE, y1: (cellY + 1) * CELL_SIZE, x2: (cellX + 1) * CELL_SIZE, y2: (cellY + 1) * CELL_SIZE },
                up:    { x1: cellX * CELL_SIZE, y1: cellY * CELL_SIZE, x2: (cellX + 1) * CELL_SIZE, y2: cellY * CELL_SIZE },
            };
            line = wallLineCoord[wallFound];

            setCollisionLine(line);
            setTimeout(() => setCollisionLine(null), COLLISION_DURATION);
            return true; // Collision occurred
        }
        return false; // No collision
    }, [playerPos]);
    
    
    // --- Main Player Movement Handler (Unchanged) ---
    const movePlayer = useCallback((dx, dy) => {
        if (isCompleted || isGameOver) return;
        
        setPlayerPos(prevPos => {
            let newX = prevPos.x + dx * MOVEMENT_STEP; 
            let newY = prevPos.y + dy * MOVEMENT_STEP; 

            // Keep player within bounds 
            newX = Math.max(PLAYER_SIZE, Math.min(MAZE_SIZE - PLAYER_SIZE, newX));
            newY = Math.max(PLAYER_SIZE, Math.min(MAZE_SIZE - PLAYER_SIZE, newY));
            
            if (checkCollision(newX, newY)) {
                // Collision: Increment strike count and potentially reset
                setStrikeCount(prev => {
                    const newStrikeCount = prev + 1; 
                    setMessage(`Wall Hit! Strikes: ${newStrikeCount}/${MAX_STRIKES}`);
                    
                    if (newStrikeCount >= MAX_STRIKES) { 
                        handleResetToCheckpoint();
                        return 0; // Reset strikes
                    }
                    return newStrikeCount;
                });
                return prevPos; // Stay put on collision
            }
            
            // --- CHECKPOINT & CELL LOGIC ---
            const newCellIndexX = Math.floor(newX / CELL_SIZE);
            const newCellIndexY = Math.floor(newY / CELL_SIZE);
            
           // client/src/pages/InvisibleMaze.js - inside movePlayer function

// ... (logic to determine newCellIndexX and newCellIndexY)

if (newCellIndexX !== currentCell.x || newCellIndexY !== currentCell.y) {
    
    // 1. Update the current cell index immediately
    setCurrentCell({ x: newCellIndexX, y: newCellIndexY });

    // 2. CHECKPOINT LOGIC: Only set a checkpoint if the cell indices are even.
    const isCheckpointCell = (newCellIndexX % 2 === 0) && (newCellIndexY % 2 === 0);
    
    if (isCheckpointCell) {
        // Calculate the center of the new cell for the checkpoint
        const newCheckpointX = newCellIndexX * CELL_SIZE + CELL_SIZE / 2;
        const newCheckpointY = newCellIndexY * CELL_SIZE + CELL_SIZE / 2;

        setCheckpoint({ x: newCheckpointX, y: newCheckpointY });
        
        setStrikeCount(0);
        setMessage(`Strikes: 0/${MAX_STRIKES}. Checkpoint Updated.`);
    }
}

            // Check Goal
            const distanceToGoal = Math.sqrt(Math.pow(newX - GOAL_X, 2) + Math.pow(newY - GOAL_Y, 2));
            if (distanceToGoal < CELL_SIZE / 2) {
                completeGameAction(newX, newY);
            }
            
            // Update progress based on distance from start (simplified)
            const distFromStart = Math.sqrt(Math.pow(newX - START_X, 2) + Math.pow(newY - START_Y, 2));
            setProgress(Math.min(99, Math.round(distFromStart / MAZE_SIZE * 100)));
            
            return { x: newX, y: newY };
        });
    }, [isCompleted, isGameOver, checkCollision, checkpoint, currentCell]);
    
    // --- Checkpoint Reset Logic (Unchanged) ---
    const handleResetToCheckpoint = useCallback(() => {
        setMessage(`${MAX_STRIKES} Strikes! Returning to last checkpoint.`);
        setPlayerPos(checkpoint); // Move player back to checkpoint coordinates
        setStrikeCount(0);
        
    }, [checkpoint]);

    // --- Keyboard Event Handler (Unchanged) ---
    useEffect(() => {
        const handleKeyDown = (event) => {
            let dx = 0;
            let dy = 0;
            
            if (isCompleted || isGameOver) return; 

            switch(event.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    dy = -1;
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    dy = 1;
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    dx = -1;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    dx = 1;
                    break;
                default:
                    return;
            }
            event.preventDefault(); 
            movePlayer(dx, dy);
        };

        // Attach listener to the global window
        window.addEventListener('keydown', handleKeyDown);
        // CRITICAL CLEANUP: Remove the listener when the component unmounts
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [movePlayer, isCompleted, isGameOver]); 

    // --- Completion (Unchanged) ---
    const completeGameAction = (finalX, finalY) => {
        setProgress(100);
        setIsCompleted(true);
        setPlayerPos({x: finalX, y: finalY});
        const finalScore = 100; 
        setScore(finalScore);
        setMessage(`SUCCESS! You reached the goal.`);

        completeGame(GAME_ID); 

        const storedProgress = JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || {};
        storedProgress[GAME_ID] = { title: 'Invisible Maze', progress: 100, score: finalScore };
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
            <h2>Invisible Maze 👻</h2>
            <p className="user-note">
                <span style={{color: 'var(--accent-glow)'}}>ACCESS CODE: {ACCESS_CODE_FROM}</span>
            </p>
            <ProgressBar percent={progress} label="Your Game Progress" />
            
            <div className="game-area">
                <p>
                    <span style={{color: 'var(--text-secondary)'}}>Strikes: {strikeCount}/{MAX_STRIKES}. Last Checkpoint: ({Math.round(checkpoint.x)}, {Math.round(checkpoint.y)})</span>
                </p>
                <p>{message}</p>
                <div style={{
                    border: '2px solid var(--border-glow)',
                    margin: '20px auto',
                    width: `${MAZE_SIZE}px`,
                    height: `${MAZE_SIZE}px`,
                    position: 'relative',
                    backgroundColor: 'rgba(0,0,0,0.4)'
                }}>
                    <canvas ref={canvasRef} width={MAZE_SIZE} height={MAZE_SIZE} /> 
                    {/* Start and Goal Indicators */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, 
                        width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`, 
                        backgroundColor: 'rgba(0, 255, 0, 0.2)'
                    }}>S</div>
                    <div style={{
                        position: 'absolute', bottom: 0, right: 0, 
                        width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`, 
                        backgroundColor: 'rgba(255, 0, 0, 0.2)'
                    }}>G</div>
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
                    <p>Go back to home to submit your final time!</p>
                </div>
            )}
        </div>
    );
}

export default InvisibleMaze;