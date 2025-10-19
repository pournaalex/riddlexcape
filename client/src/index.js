import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; 
import './index.css'; 
import App from './App';

// Find the root element from the index.html file
const container = document.getElementById('root');
const root = createRoot(container); 

// REMOVED: <React.StrictMode> wrapper to prevent double-rendering bugs
root.render(
  <BrowserRouter>
      <App />
  </BrowserRouter>
);