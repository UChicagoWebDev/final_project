import React from 'react';
import { createRoot } from 'react-dom/client';
import AppRouter from './App';

const container = document.getElementById('root');
const root = createRoot(container); // Initialize the root.

root.render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);
