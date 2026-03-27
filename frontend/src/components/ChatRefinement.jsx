import React, { useState, useRef, useEffect } from 'react';

function ChatRefinement({ chatHistory, onRefineSubmit, error, disabled }) {
  const [message, setMessage] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.trim() && !isRefining && !disabled) {
      setIsRefining(true);
      const currentMessage = message;
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      try {
        await onRefineSubmit(currentMessage);
      } catch (err) {
        console.error('Refinement error:', err);
      } finally {
        setIsRefining(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e) => {
    setMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3 className="chat-title">Refine your spec</h3>
        <p className="chat-subtitle">Describe what to change and the spec will update.</p>
      </div>

      <div className="chat-history">
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`chat-message ${msg.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}`}
          >
            <div className="chat-message-content">{msg.content}</div>
          </div>
        ))}
        {isRefining && (
          <div className="chat-message chat-message-assistant">
            <div className="chat-message-loading">
              <span className="chat-loading-dot"></span>
              <span className="chat-loading-dot"></span>
              <span className="chat-loading-dot"></span>
            </div>
          </div>
        )}
        {error && (
          <div className="chat-message chat-message-assistant">
            <div className="chat-message-content" style={{ color: 'var(--color-error)' }}>
              {error}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <textarea
          ref={textareaRef}
          className="chat-input-textarea"
          value={message}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Wait for generation to complete..." : "Describe what to change..."}
          rows={1}
          disabled={isRefining || disabled}
        />
        <button
          type="submit"
          className="button button-primary chat-send-button"
          disabled={!message.trim() || isRefining || disabled}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatRefinement;
