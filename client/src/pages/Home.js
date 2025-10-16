import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProgressBar from '../components/ProgressBar';

const API_BASE_URL = 'https://riddlexcape.onrender.com';

// Define the initial state structure with only the Broken Calculator
const INITIAL_GAME_PROGRESS = {
    'broken-calc': { title: 'Broken Calculator', progress: 0, score: 0 }
};

// Helper function to get or create a unique user ID for this session/browser
const getUserId = () => {
    let userId = localStorage.getItem('riddlescapeUserId');
    if (!userId) {
        // Generate a random ID (simulates new anonymous user/session)
        userId = Math.random().toString(36).substring(2, 9);
        localStorage.setItem('riddlescapeUserId', userId);
    }
    return userId;
};


function Home() {
    const [accessCode, setAccessCode] = useState('');
    const [error, setError] = useState('');
    const [gameProgress, setGameProgress] = useState(INITIAL_GAME_PROGRESS);
    const [userId, setUserId] = useState(null); // New state to hold the current user ID
    const navigate = useNavigate();

    // UseEffect to fetch and calculate scores whenever the component loads
    useEffect(() => {
        // 1. Get the current user ID
        const currentUserId = getUserId();
        setUserId(currentUserId);
        
        // 2. Use the unique user ID in the localStorage key
        const userSpecificKey = `riddlescapeProgress_${currentUserId}`;
        const storedProgress = localStorage.getItem(userSpecificKey);
        
        let currentProgress = INITIAL_GAME_PROGRESS;
        
        if (storedProgress) {
            const parsed = JSON.parse(storedProgress);
            // Merge stored data, overwriting defaults where available
            currentProgress = { 
                ...INITIAL_GAME_PROGRESS, 
                ...parsed 
            };
        }
        
        setGameProgress(currentProgress);
        
    }, []); 

    // Calculate overall score and progress based on current state
    const totalScore = Object.values(gameProgress).reduce((sum, game) => sum + (game.score || 0), 0);
    // Max score is now only 100 points (1 game * 100 max)
    const totalMaxScore = Object.keys(INITIAL_GAME_PROGRESS).length * 100; 
    const overallProgress = (totalScore / totalMaxScore) * 100;
    
    const handleCodeSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            const response = await axios.post(`${API_BASE_URL}/api/validate-code`, {
                code: accessCode
            });

            if (response.data.success) {
                // If successful, navigate to the route provided by the backend
                navigate(response.data.route);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error validating code.');
        }
        setAccessCode('');
    };

    return (
        <div className="home-container">
            <h1>RiddlEscape 🔑</h1>
            {/* Display the unique user ID */}
            {userId && <p className="user-id-display">Agent ID: {userId}</p>} 
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
                />
                <button type="submit">Unlock Game</button>
                {error && <p className="error-message">{error}</p>}
            </form>

            <div className="game-list">
                <h3>Game Status:</h3>
                {Object.entries(gameProgress).map(([key, game]) => (
                    <div key={key} className="game-card">
                        <h4>{game.title}</h4>
                        <ProgressBar percent={game.progress} label="Completion Status" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Home;
