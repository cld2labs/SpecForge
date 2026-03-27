import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import { useTheme } from '../contexts/ThemeContext';
import MessageBubble from './MessageBubble';
import * as api from '../utils/api';
import './GeneratingState.css';

export default function GeneratingState({ statusMessage, spec, isComplete, onRefine, sessionId }) {
  const [isRefining, setIsRefining] = useState(false);
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);
  const specContentRef = useRef(null);
  const diagramDataRef = useRef([]); // Store original diagram code
  const { theme } = useTheme();

  // Chat-based refinement state
  const [chatHistory, setChatHistory] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [actionMode, setActionMode] = useState('refine');
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);

  // Initialize Mermaid with theme-aware configuration
  useEffect(() => {
    const isDark = theme === 'dark';

    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      themeVariables: isDark ? {
        primaryColor: '#6B46C1',
        primaryTextColor: '#F5F3FF',
        primaryBorderColor: '#6B46C1',
        lineColor: '#B8A3D9',
        secondaryColor: '#C2185B',
        tertiaryColor: '#1A1228',
      } : {
        primaryColor: '#6B46C1',
        primaryTextColor: '#1A1228',
        primaryBorderColor: '#6B46C1',
        lineColor: '#8B7BB8',
        secondaryColor: '#C2185B',
        tertiaryColor: '#F5F3FF',
      },
      er: {
        diagramPadding: 20,
        layoutDirection: 'TB',
        minEntityWidth: 100,
      },
      securityLevel: 'loose',
    });
  }, [theme]);

  // Render Mermaid diagrams whenever spec or theme changes
  useEffect(() => {
    if (!spec || !specContentRef.current || showRawMarkdown) return;

    const renderDiagrams = async () => {
      try {
        // Find all code blocks that should be Mermaid diagrams
        const codeBlocks = specContentRef.current.querySelectorAll('pre code.language-mermaid');
        // Also find already-rendered containers
        const containers = specContentRef.current.querySelectorAll('pre.mermaid-container');

        const elementsToProcess = codeBlocks.length > 0 ? codeBlocks : containers;
        console.log(`Found ${elementsToProcess.length} Mermaid diagrams to render with ${theme} theme`);

        for (let index = 0; index < elementsToProcess.length; index++) {
          const element = elementsToProcess[index];
          try {
            let code, preElement;

            // If it's a code element, extract code and get pre parent
            if (element.tagName === 'CODE') {
              code = element.textContent;
              preElement = element.parentElement;
              // Store code for theme changes
              if (!diagramDataRef.current[index]) {
                diagramDataRef.current[index] = code;
              }
            } else {
              // It's already a container, use stored code
              code = diagramDataRef.current[index];
              preElement = element;
            }

            if (!code) continue;

            const id = `mermaid-diagram-${index}-${Date.now()}`;
            console.log(`Rendering diagram ${index}:`, code.substring(0, 50) + '...');

            // Create a wrapper div for the diagram
            const diagramDiv = document.createElement('div');
            diagramDiv.className = 'mermaid-diagram';
            diagramDiv.id = id;
            diagramDiv.textContent = code;

            // Clear the pre element and insert diagram div
            preElement.innerHTML = '';
            preElement.appendChild(diagramDiv);
            preElement.classList.add('mermaid-container');

            // Render the diagram with error handling
            try {
              await mermaid.run({ nodes: [diagramDiv] });
            } catch (error) {
              console.error(`Mermaid rendering error for diagram ${index}:`, error);
              // Show graceful fallback message
              diagramDiv.className = 'mermaid-diagram-error';
              diagramDiv.innerHTML = `<div style="background: var(--color-bg-elevated); border: 1px solid var(--color-border); border-radius: 8px; padding: 16px; color: var(--color-text-secondary); font-size: 13px; line-height: 1.6;">
                Diagram could not be rendered — view the raw spec for this diagram
              </div>`;
            }
          } catch (err) {
            console.error(`Error processing diagram ${index}:`, err);
          }
        }
      } catch (error) {
        console.error('Fatal error in Mermaid rendering:', error);
      }
    };

    // Initial render
    renderDiagrams();

    // Retry after streaming completes to catch diagrams that failed due to incomplete content
    if (isComplete) {
      const retryTimer = setTimeout(() => {
        console.log('Retrying Mermaid rendering after stream completion...');
        renderDiagrams();
      }, 500);

      return () => clearTimeout(retryTimer);
    }
  }, [spec, isComplete, showRawMarkdown, theme]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isRefining]);

  // Auto-focus textarea when refinement panel appears
  useEffect(() => {
    if (isComplete && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isComplete]);

  const handleDownload = () => {
    const blob = new Blob([spec], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `architecture-spec-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(spec);
    alert('Specification copied to clipboard!');
  };

  const handleSubmit = async () => {
    if (!inputMessage.trim() || isRefining || !sessionId) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      actionType: actionMode,
      timestamp: new Date().toISOString(),
    };

    // Add user message to chat history
    setChatHistory(prev => [...prev, userMessage]);
    const messageToSend = inputMessage;
    setInputMessage('');
    setIsRefining(true);

    try {
      if (actionMode === 'refine') {
        // Refine the spec
        await onRefine(messageToSend);

        const assistantMessage = {
          role: 'assistant',
          content: 'Specification updated successfully. Check the preview above for changes.',
          timestamp: new Date().toISOString(),
        };
        setChatHistory(prev => [...prev, assistantMessage]);
      } else if (actionMode === 'chat') {
        // Ask a question without modifying spec
        const response = await api.askQuestion(sessionId, spec, messageToSend);

        const assistantMessage = {
          role: 'assistant',
          content: response.answer,
          timestamp: new Date().toISOString(),
        };
        setChatHistory(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error(`${actionMode} failed:`, error);

      const errorMessage = {
        role: 'assistant',
        content: actionMode === 'refine'
          ? 'Failed to update specification. Please try again.'
          : 'Failed to answer question. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsRefining(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="generating-state">
      {!spec ? (
        <div className="generating-content">
          <div className="generating-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <p className="generating-message">{statusMessage || 'Generating your specification...'}</p>
        </div>
      ) : (
        <div className="spec-container">
          <div className="spec-preview">
            <div className="spec-preview-header">
              <div className="spec-header-left">
                <h3>Your Architecture Specification</h3>
                <p className="spec-status">{statusMessage}</p>
              </div>
              <div className="spec-actions">
                <button
                  onClick={() => setShowRawMarkdown(!showRawMarkdown)}
                  className="spec-action-btn"
                  title={showRawMarkdown ? "Show Rendered View" : "Show Raw Markdown"}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                  </svg>
                  {showRawMarkdown ? 'Rendered' : 'Raw'}
                </button>
                <button onClick={handleCopy} className="spec-action-btn" title="Copy to clipboard">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  Copy
                </button>
                <button onClick={handleDownload} className="spec-action-btn spec-action-primary" title="Download as Markdown">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Download
                </button>
              </div>
            </div>
            <div className="spec-preview-content">
              {showRawMarkdown ? (
                <pre className="raw-markdown">{spec}</pre>
              ) : (
                <div key="rendered-view" ref={specContentRef}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {spec}
                  </ReactMarkdown>
                  {!isComplete && <span className="typing-cursor">▋</span>}
                </div>
              )}
            </div>
          </div>

          {isComplete && (
            <div className="refinement-panel">
              <div className="refinement-header">
                <h4>Refine Your Spec</h4>
                <p>Ask for changes, additions, or clarifications</p>
              </div>

              <div className="chat-container" ref={chatContainerRef}>
                {chatHistory.length === 0 ? (
                  <div className="chat-empty-state">
                    <p className="empty-state-title">What would you like to improve?</p>
                    <div className="quick-actions">
                      <button
                        className="quick-action-chip"
                        onClick={() => setInputMessage('Add more details about authentication and authorization')}
                      >
                        Add authentication details
                      </button>
                      <button
                        className="quick-action-chip"
                        onClick={() => setInputMessage('Include performance considerations and optimization strategies')}
                      >
                        Add performance section
                      </button>
                      <button
                        className="quick-action-chip"
                        onClick={() => setInputMessage('Expand the API design with more endpoints')}
                      >
                        Expand API design
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="chat-history">
                    {chatHistory.map((msg, index) => (
                      <MessageBubble
                        key={index}
                        role={msg.role}
                        content={msg.content}
                        actionType={msg.actionType}
                        timestamp={msg.timestamp}
                      />
                    ))}
                    {isRefining && (
                      <MessageBubble role="assistant" content="" isTyping={true} />
                    )}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>

              <div className="chat-input-container">
                <textarea
                  ref={textareaRef}
                  className="chat-input"
                  placeholder="Describe what you'd like to change or add..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isRefining}
                  rows={2}
                />
                <div className="chat-actions">
                  <button
                    type="button"
                    className={`chat-action-btn ${actionMode === 'refine' ? 'primary' : ''}`}
                    onClick={() => {
                      if (actionMode === 'refine' && inputMessage.trim() && !isRefining) {
                        handleSubmit();
                      } else {
                        setActionMode('refine');
                      }
                    }}
                    disabled={isRefining}
                  >
                    <span>🔧</span>
                    {actionMode === 'refine' ? 'Send' : 'Refine Spec'}
                  </button>
                  <button
                    type="button"
                    className={`chat-action-btn ${actionMode === 'chat' ? 'primary' : ''}`}
                    onClick={() => {
                      if (actionMode === 'chat' && inputMessage.trim() && !isRefining) {
                        handleSubmit();
                      } else {
                        setActionMode('chat');
                      }
                    }}
                    disabled={isRefining}
                  >
                    <span>💬</span>
                    {actionMode === 'chat' ? 'Send' : 'Ask Question'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
