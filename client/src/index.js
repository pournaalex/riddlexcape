import React from 'react';
import { createRoot } from 'react-dom/client';
// 1. IMPORT BrowserRouter from react-router-dom
import { BrowserRouter } from 'react-router-dom'; 
import './index.css'; 
import App from './App';

// Find the root element from the index.html file
const container = document.getElementById('root');
const root = createRoot(container); 

// 2. Wrap the entire application in <BrowserRouter>
root.render(
  <React.StrictMode>
    <BrowserRouter>
        <App />
    </BrowserRouter>
  </React.StrictMode>
);
