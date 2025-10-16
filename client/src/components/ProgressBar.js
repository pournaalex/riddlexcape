import React from 'react';
// You would add CSS to client/src/index.css for styling this component

const ProgressBar = ({ percent, label }) => {
    const clampedPercent = Math.min(100, Math.max(0, percent));
    return (
        <div className="progress-bar-container">
            <label>{label} ({clampedPercent.toFixed(0)}%)</label>
            <div className="progress-bar-track">
                <div 
                    className="progress-bar-fill" 
                    style={{ width: `${clampedPercent}%` }}
                ></div>
            </div>
        </div>
    );
};

export default ProgressBar;