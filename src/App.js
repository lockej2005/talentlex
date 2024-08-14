import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Layout from './pages/Layout';
import Comparison from './pages/Comparison';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Comparison />} />
          {/* Add more routes here as needed */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;