const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// --- IN-MEMORY STORAGE (Lost on server restart) ---
const COMPLETION_RECORDS = []; 

// Access Codes and corresponding game routes
const ACCESS_CODES = {
    'CALCFAIL': '/broken-calc',
    // Code received from Broken Calc -> Unlocks Painted Cube
    'BETA': '/painted-cube', 
    
    // Code received from Painted Cube -> Unlocks Invisible Maze
    'JET2MAZE': '/invisible-maze',
    
    // Code received from Invisible Maze -> Unlocks Mirror Typing
    'R3V3RB': '/mirror-typing',
    
    // Code received from Mirror Typing -> Unlocks Seating Arrangement (Final Game)
    'SEATS4U': '/seating-arrangement',
};

// Middleware
app.use(cors());
app.use(express.json());

// API Route for Access Code Validation
app.post('/api/validate-code', (req, res) => {
    const { code } = req.body;
    const normalizedCode = code.toUpperCase().trim();

    const route = ACCESS_CODES[normalizedCode];

    if (route) {
        // Code is valid, return the game route
        res.json({ success: true, route });
    } else {
        // Code is invalid
        res.status(401).json({ success: false, message: 'Invalid Access Code.' });
    }
});

// --- API ROUTE for Submitting Final Score ---
app.post('/api/submit-score', (req, res) => {
    const { username, totalTime, finalScore } = req.body;

    if (!username || !totalTime || finalScore === undefined) {
        return res.status(400).json({ success: false, message: 'Missing submission data.' });
    }

    const record = {
        username,
        finalScore,
        totalTime,
        timestamp: new Date().toISOString()
    };

    COMPLETION_RECORDS.push(record);
    console.log(`New Completion Record: ${username} finished in ${totalTime}`);
    console.log('All Records:', COMPLETION_RECORDS);

    res.json({ success: true, message: 'Completion recorded!' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});