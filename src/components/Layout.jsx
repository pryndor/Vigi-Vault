import { Link } from 'react-router-dom';
import './Layout.css';

function Layout({ children }) {
  return (
    <div className="layout">
      <header className="top-menu">
        <nav className="menu-nav">
          <Link to="/" className="menu-item">Home</Link>
          <Link to="/active-cases" className="menu-item">Active Cases</Link>
          <Link to="/worklist" className="menu-item">Worklist</Link>
          <Link to="/case-form" className="menu-item">Case Form</Link>
          <Link to="/reports" className="menu-item">Reports</Link>
          <Link to="/help" className="menu-item">Help</Link>
          <div className="menu-item user-menu">
            User ▾
          </div>
        </nav>
      </header>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;

