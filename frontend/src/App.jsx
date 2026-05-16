import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import FruitPage from './pages/fruit/FruitPage/FruitPage.jsx'
import FruitCreatePage from './pages/fruit/FruitCreatePage/FruitCreatePage.jsx'
import FruitDetailPage from './pages/fruit/FruitDetailPage/FruitDetailPage.jsx'
import VisualEntityPage from './pages/visual/VisualEntityPage/VisualEntityPage.jsx'
import VisualEntityCreatePage from './pages/visual/VisualEntityCreatePage/VisualEntityCreatePage.jsx'
import NavBar from './components/NavBar.jsx'

function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/fruit" replace />} />
        <Route path="/fruit" element={<FruitPage />} />
          <Route path="/fruit/create" element={<FruitCreatePage />} />
        <Route path="/fruit/:id" element={<FruitDetailPage />} />
        <Route path="/visual-entity" element={<VisualEntityPage />} />
          <Route path="/visual-entity/create" element={<VisualEntityCreatePage />} />
          {/*<Route path="/visual-entity/:id" element={<VisualEntityDetailPage />} />*/}
      </Routes>
    </Router>
  )
}

export default App
