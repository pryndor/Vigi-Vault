import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home-page">
      <div className="welcome-section">
        <h1 className="welcome-title">Welcome to Argus Safety</h1>
      </div>

      <div className="action-buttons">
        <Link to="/case-form" className="action-btn create-case">
          <span className="btn-icon">+</span>
          <span className="btn-text">Create Case</span>
        </Link>
        
        <Link to="/worklist" className="action-btn my-worklist">
          <span className="btn-icon">📋</span>
          <span className="btn-text">My Worklist</span>
        </Link>
        
        <Link to="/search" className="action-btn search-case">
          <span className="btn-icon">🔍</span>
          <span className="btn-text">Search Case</span>
        </Link>
      </div>

      <div className="summary-box">
        <h3 className="summary-title">My Tasks</h3>
        <div className="summary-items">
          <div className="summary-item">
            <span className="summary-label">New Cases:</span>
            <span className="summary-value">5</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Follow-ups:</span>
            <span className="summary-value">2</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;

