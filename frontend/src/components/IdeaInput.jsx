import React, { useState } from 'react';

function IdeaInput({ onSubmit, initialValue = '' }) {
  const [idea, setIdea] = useState(initialValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (idea.trim()) {
      onSubmit(idea);
    }
  };

  const charCount = idea.length;

  return (
    <div className="idea-input-container">
      <div className="idea-input-content">
        <form onSubmit={handleSubmit}>
          <div className="idea-input-form">
            <label htmlFor="idea-textarea" className="idea-input-label">
              What are you building?
            </label>
            <div className="idea-textarea-wrapper">
              <textarea
                id="idea-textarea"
                className="textarea idea-textarea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Describe your idea in plain language. For example: a platform where local service providers can list their availability and customers can book appointments directly."
                rows={6}
              />
              <div className="idea-char-count">
                {charCount} characters
              </div>
            </div>
            <button
              type="submit"
              className="button button-primary idea-continue-button"
              disabled={!idea.trim()}
            >
              Continue →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default IdeaInput;
