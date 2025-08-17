import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

/**
 * Application Entry Point
 * 
 * Renders the root App component into the DOM using React 18's createRoot API.
 * The index.css file contains global styles including Tailwind CSS imports.
 * 
 * React 18 features enabled:
 * - Concurrent rendering for better performance
 * - Automatic batching of state updates
 * - Suspense improvements for data fetching
 */
createRoot(document.getElementById("root")!).render(<App />);
