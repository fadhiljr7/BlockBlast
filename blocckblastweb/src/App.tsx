import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import NotFound from './pages/NotFound'
import Privacy from './pages/Privacy'
import Support from './pages/Support'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="support" element={<Support />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
