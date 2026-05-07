import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import FruitPage from './pages/fruit/FruitPage.jsx'
import VisualEntityPage from './pages/visual/VisualEntityPage.jsx'
import NavBar from './components/NavBar.jsx'

function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/fruit" replace />} />
        <Route path="/fruit" element={<FruitPage />} />
        <Route path="/visual-entity" element={<VisualEntityPage />} />
      </Routes>
    </Router>
  )
}

export default App
