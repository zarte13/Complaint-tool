import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import Navigation from './components/Navigation/Navigation';
import HomePage from './pages/HomePage';
import SecondPage from './pages/SecondPage';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/second" element={<SecondPage />} />
          </Routes>
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;