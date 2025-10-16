import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'; // Import the global CSS file
import App from './App';

// Find the root element from the index.html file
const container = document.getElementById('root');
const root = createRoot(container); // Create a React root for concurrent mode

// Render the main App component, which contains the routing logic
// and all other pages and components.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Note: If you used an older version of React/create-react-app, 
// the code might use ReactDOM.render(), but createRoot is the modern standard.