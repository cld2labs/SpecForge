import React from 'react';

const STEPS = [
  { id: 'idea', label: 'Idea' },
  { id: 'questions', label: 'Questions' },
  { id: 'generating', label: 'Generating' },
  { id: 'review', label: 'Review' },
  { id: 'download', label: 'Download' }
];

function StepIndicator({ currentStep }) {
  const currentIndex = STEPS.findIndex(step => step.id === currentStep);

  return (
    <div className="step-indicator">
      <div className="step-track">
        {STEPS.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;

          return (
            <React.Fragment key={step.id}>
              <div className={`step ${isActive ? 'step-active' : ''} ${isCompleted ? 'step-completed' : ''}`}>
                <div className="step-circle">
                  {isCompleted ? (
                    <svg className="step-checkmark" viewBox="0 0 16 16" fill="none">
                      <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span className="step-number">{index + 1}</span>
                  )}
                </div>
                <span className="step-label">{step.label}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`step-connector ${isCompleted ? 'step-connector-completed' : ''}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default StepIndicator;
