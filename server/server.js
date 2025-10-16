const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Access Codes and corresponding game routes
const ACCESS_CODES = {
    // 'DOTS4LIFE': '/nine-dot', // REMOVED
    'CALCFAIL': '/broken-calc' // Code to unlock the Broken Calculator
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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
