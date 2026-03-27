import React, { useState } from 'react';

function ClarifyingQuestions({ onBack, onSubmit, error }) {
  const [answers, setAnswers] = useState({
    users: '',
    scale: '',
    data_pattern: '',
    sensitive_data: '',
    stack_preference: '',
    priority: '',
    concerns: ''
  });

  const handleChange = (field, value) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const requiredFields = ['users', 'scale', 'data_pattern', 'sensitive_data', 'priority'];
    const allRequiredFilled = requiredFields.every(field => answers[field].trim() !== '');

    if (allRequiredFilled) {
      onSubmit(answers);
    }
  };

  const requiredFields = ['users', 'scale', 'data_pattern', 'sensitive_data', 'priority'];
  const isFormValid = requiredFields.every(field => answers[field].trim() !== '');

  return (
    <div className="clarifying-questions-container">
      <div className="clarifying-questions-content">
        <div className="clarifying-questions-header">
          <h2 className="clarifying-questions-title">Help us understand your system</h2>
          <p className="clarifying-questions-subtitle">
            Your answers shape the quality of the architecture output.
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="clarifying-questions-form">
          {error && <div className="error-message">{error}</div>}
          <div className="question-group">
            <label htmlFor="users" className="label">
              1. Who are the primary users of this system?
            </label>
            <input
              id="users"
              type="text"
              className="input"
              value={answers.users}
              onChange={(e) => handleChange('users', e.target.value)}
              required
            />
          </div>

          <div className="question-group">
            <label htmlFor="scale" className="label">
              2. Expected scale at launch
            </label>
            <select
              id="scale"
              className="select"
              value={answers.scale}
              onChange={(e) => handleChange('scale', e.target.value)}
              required
            >
              <option value="">Select scale...</option>
              <option value="personal">Personal project</option>
              <option value="small_team">Small team (under 50 users)</option>
              <option value="public">Public product (50–10k users)</option>
              <option value="large_scale">Large scale (10k+ users)</option>
            </select>
          </div>

          <div className="question-group">
            <label htmlFor="data_pattern" className="label">
              3. Data access pattern
            </label>
            <select
              id="data_pattern"
              className="select"
              value={answers.data_pattern}
              onChange={(e) => handleChange('data_pattern', e.target.value)}
              required
            >
              <option value="">Select pattern...</option>
              <option value="read_heavy">Read-heavy</option>
              <option value="write_heavy">Write-heavy</option>
              <option value="balanced">Balanced</option>
            </select>
          </div>

          <div className="question-group">
            <label htmlFor="sensitive_data" className="label">
              4. Does this system handle sensitive data?
            </label>
            <select
              id="sensitive_data"
              className="select"
              value={answers.sensitive_data}
              onChange={(e) => handleChange('sensitive_data', e.target.value)}
              required
            >
              <option value="">Select option...</option>
              <option value="none">No sensitive data</option>
              <option value="personal">Personal user data</option>
              <option value="financial">Financial data</option>
              <option value="health">Health data</option>
            </select>
          </div>

          <div className="question-group">
            <label htmlFor="stack_preference" className="label">
              5. Preferred tech stack (optional)
            </label>
            <input
              id="stack_preference"
              type="text"
              className="input"
              value={answers.stack_preference}
              onChange={(e) => handleChange('stack_preference', e.target.value)}
              placeholder="e.g. React, Node, PostgreSQL — or leave blank for open recommendations"
            />
          </div>

          <div className="question-group">
            <label htmlFor="priority" className="label">
              6. Most important quality right now
            </label>
            <select
              id="priority"
              className="select"
              value={answers.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              required
            >
              <option value="">Select priority...</option>
              <option value="speed">Speed to build</option>
              <option value="scalability">Scalability</option>
              <option value="security">Security</option>
              <option value="cost">Cost efficiency</option>
            </select>
          </div>

          <div className="question-group">
            <label htmlFor="concerns" className="label">
              7. Anything you are specifically worried about? (optional)
            </label>
            <textarea
              id="concerns"
              className="textarea"
              value={answers.concerns}
              onChange={(e) => handleChange('concerns', e.target.value)}
              rows={3}
            />
          </div>

          <div className="clarifying-questions-actions">
            <button
              type="button"
              className="link"
              onClick={onBack}
            >
              ← Back
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={!isFormValid}
            >
              Generate Spec →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClarifyingQuestions;
