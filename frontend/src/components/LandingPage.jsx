import './LandingPage.css';

function LandingPage({ onGetStarted }) {
  return (
    <div className="landing-page">
      <div className="landing-grid">
        {/* LEFT COLUMN */}
        <div className="landing-left">
          {/* Badge */}
          <div className="landing-badge">
            <div className="landing-badge-dot"></div>
            <span className="landing-badge-text">Cloud2 Labs Innovation Hub</span>
          </div>

          {/* Title */}
          <h1 className="landing-h1">SpecForge</h1>

          {/* Subtitle */}
          <h2 className="landing-h2">Architecture Specifications, Powered by AI</h2>

          {/* Description */}
          <p className="landing-description">
            Stop building without a blueprint. SpecForge asks the right questions about your project idea,
            then generates a production-ready architecture specification you can drop directly into
            Claude Code, Cursor, Windsurf, or any AI coding tool.
          </p>

          {/* CTA Button */}
          <button className="landing-cta" onClick={onGetStarted}>
            <span>Start Building Your Spec</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        {/* RIGHT COLUMN */}
        <div className="landing-right">
          {/* Preview Card */}
          <div className="landing-preview-card">
            <div className="preview-chat-bubble assistant">
              <p>Hi! Tell me what you want to build — I'll ask smart questions to understand your architecture needs.</p>
            </div>
            <div className="preview-chat-bubble user">
              <p>I want to build a recipe sharing app</p>
            </div>
            <div className="preview-chat-bubble assistant">
              <p>Great! Can anyone post recipes, or only verified chefs?</p>
            </div>
            <div className="preview-chips">
              <span className="preview-chip">Anyone can post</span>
              <span className="preview-chip">Only verified chefs</span>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="landing-features">
            {[ 'Smart Questioning', 'Production-Ready Specs', 'Markdown Export', 'Zero Setup'].map((tag) => (
              <div key={tag} className="landing-feature-tag">
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
