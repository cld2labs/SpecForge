import { useState } from 'react';
import './QuestionChips.css';

export default function QuestionChips({ question, onAnswer }) {
  const [selectedChip, setSelectedChip] = useState(null);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChipClick = (chipText) => {
    if (isSubmitting) return;

    setSelectedChip(chipText);
    setIsSubmitting(true);

    setTimeout(() => {
      onAnswer(chipText);
    }, 300);
  };

  const handleCustomClick = () => {
    setShowCustomInput(true);
    setSelectedChip(null);
  };

  const handleCustomSubmit = () => {
    const answer = customInput.trim();
    if (answer) {
      setIsSubmitting(true);
      setTimeout(() => {
        onAnswer(answer);
      }, 300);
    }
  };

  return (
    <div className="question-chips">
      {!showCustomInput && (
        <div className="chips-container">
          {question.chips.map((chip, index) => (
            <button
              key={index}
              className={`chip ${selectedChip === chip ? 'chip-selected' : ''} ${isSubmitting ? 'chips-disabled' : ''}`}
              onClick={() => handleChipClick(chip)}
              disabled={isSubmitting}
            >
              {chip}
            </button>
          ))}
          {question.allow_free_text && (
            <button
              className={`chip chip-custom ${isSubmitting ? 'chips-disabled' : ''}`}
              onClick={handleCustomClick}
              disabled={isSubmitting}
            >
              My own answer...
            </button>
          )}
        </div>
      )}

      {showCustomInput && (
        <div className="custom-input-container">
          <textarea
            className="custom-input"
            placeholder="Type your answer here..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (customInput.trim()) handleCustomSubmit();
              }
            }}
            autoFocus
            rows={3}
          />
          <button
            className="custom-submit-btn"
            onClick={handleCustomSubmit}
            disabled={!customInput.trim()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
