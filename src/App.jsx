import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ActiveCases from './pages/ActiveCases';
import Worklist from './pages/Worklist';
import CaseForm from './pages/CaseForm';
import Reports from './pages/Reports';
import Help from './pages/Help';
import Search from './pages/Search';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/active-cases" element={<ActiveCases />} />
          <Route path="/worklist" element={<Worklist />} />
          <Route path="/case-form" element={<CaseForm />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/help" element={<Help />} />
          <Route path="/search" element={<Search />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
