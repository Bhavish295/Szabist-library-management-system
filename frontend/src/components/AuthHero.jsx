import { FiBookOpen } from 'react-icons/fi';

// Split-panel hero shown alongside every auth form. Gives the login/register/
// forgot-password flow a consistent, brand-forward first impression instead
// of a bare centered card.
const AuthHero = ({ heading, body }) => (
  <div className="auth-hero">
    <div className="auth-hero-content">
      <div className="auth-hero-brand">
        <FiBookOpen /> Szabist Digital Library
      </div>
      <h2>{heading}</h2>
      <p>{body}</p>
    </div>
    <div className="auth-hero-card">
      <span className="due-stamp">
        <span className="due-stamp-label">Date Due</span>
        <span className="due-stamp-date">On time, every time</span>
      </span>
      <p>Automatic reminders land in your inbox before a book is ever late.</p>
    </div>
  </div>
);

export default AuthHero;
