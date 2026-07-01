import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import FruitPage from './pages/fruit/FruitPage/FruitPage.jsx'
import FruitCreatePage from './pages/fruit/FruitCreatePage/FruitCreatePage.jsx'
import FruitDetailPage from './pages/fruit/FruitDetailPage/FruitDetailPage.jsx'
import VisualEntityPage from './pages/visual/VisualEntityPage/VisualEntityPage.jsx'
import VisualEntityCreatePage from './pages/visual/VisualEntityCreatePage/VisualEntityCreatePage.jsx'
import DocumentPage from './pages/document/DocumentPage.jsx'
import DocumentDetailPage from './pages/document/DocumentDetailPage.jsx'
import NavBar from './components/NavBar.jsx'
import PageTransition from './components/PageTransition.jsx'
import { ToastProvider } from './hooks/useToast.jsx'

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/fruit" replace />} />
        
        <Route path="/fruit" element={
          <PageTransition variant="fade-slide">
            <FruitPage />
          </PageTransition>
        } />
        
        <Route path="/fruit/create" element={
          <PageTransition variant="scale-up">
            <FruitCreatePage />
          </PageTransition>
        } />
        
        <Route path="/fruit/:id" element={
          <PageTransition variant="fade-slide">
            <FruitDetailPage />
          </PageTransition>
        } />
        
        <Route path="/visual-entity" element={
          <PageTransition variant="fade-slide">
            <VisualEntityPage />
          </PageTransition>
        } />
        
        <Route path="/visual-entity/create" element={
          <PageTransition variant="scale-up">
            <VisualEntityCreatePage />
          </PageTransition>
        } />

        <Route path="/document" element={
          <PageTransition variant="fade-slide">
            <DocumentPage />
          </PageTransition>
        } />

        <Route path="/document/:name" element={
          <PageTransition variant="fade-slide">
            <DocumentDetailPage />
          </PageTransition>
        } />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <ToastProvider>
      <Router>
        <NavBar />
        <AnimatedRoutes />
      </Router>
    </ToastProvider>
  )
}

export default App
