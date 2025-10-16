import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
// import NineDotChallenge from './pages/NineDotChallenge'; // REMOVED
import BrokenCalculator from './pages/BrokenCalculator';
// import './index.css';

function App() {
    return (
        <Router>
            <div className="app">
                <Routes>
                    <Route path="/" element={<Home />} />
                    {/* REMOVED: <Route path="/nine-dot" element={<NineDotChallenge />} /> */}
                    <Route path="/broken-calc" element={<BrokenCalculator />} />
                    {/* Add a 404/not found route if desired */}
                </Routes>
            </div>
        </Router>
    );
}

export default App;
