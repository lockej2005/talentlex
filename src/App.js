import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Application from './pages/Application';
import Comparison from './pages/Comparison';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/application" element={<Application />} />
          <Route path="/comparison" element={<Comparison />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;