import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Comparison from './pages/Comparison';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Comparison />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;