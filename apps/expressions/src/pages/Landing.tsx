import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing-content">
        <header className="landing-header">
          <h1 className="landing-name">Timothy Butler</h1>
        </header>

        <nav className="landing-nav">
          <Link to="/expressions" className="landing-link primary">
            <span className="link-title">Expressions</span>
          </Link>

          <a
            href="https://github.com/tbutler1132/vital-systems"
            target="_blank"
            rel="noopener noreferrer"
            className="landing-link"
          >
            <span className="link-title">Vital Systems</span>
          </a>
        </nav>
      </div>
    </div>
  );
}
