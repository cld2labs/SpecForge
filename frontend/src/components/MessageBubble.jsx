import './MessageBubble.css';

export default function MessageBubble({ role, content, isTyping = false, actionType, timestamp }) {
  return (
    <div className={`message-bubble-wrapper ${role}`}>
      {role === 'assistant' && (
        <div className="message-avatar">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="16" fill="#6B46C1"/>
            <path d="M16 8L20 12L16 16L12 12L16 8Z" fill="white"/>
            <path d="M16 16L20 20L16 24L12 20L16 16Z" fill="white" opacity="0.6"/>
          </svg>
        </div>
      )}
      <div className="message-content">
        {actionType && role === 'user' && (
          <span className={`action-badge ${actionType}`}>
            {actionType === 'refine' ? '🔧 Refine' : actionType === 'chat' ? '💬 Question' : '✨ Action'}
          </span>
        )}
        {isTyping ? (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        ) : (
          <p>{content}</p>
        )}
        {timestamp && !isTyping && (
          <span className="message-timestamp">
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}
