import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChatRefinement from './ChatRefinement';

function SpecViewer({ spec, chatHistory, onRefineSubmit, onDownloadClick, error, isStreaming }) {
  const specPanelRef = useRef(null);

  useEffect(() => {
    if (specPanelRef.current && !isStreaming) {
      specPanelRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [spec, isStreaming]);

  return (
    <div className="spec-viewer">
      <div className="spec-panel" ref={specPanelRef}>
        <div className="spec-header">
          <button
            onClick={onDownloadClick}
            className="button button-primary spec-download-button"
            disabled={isStreaming}
          >
            Download Spec
          </button>
        </div>
        <div className="spec-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ node, ...props }) => <h1 className="spec-h1" {...props} />,
              h2: ({ node, ...props }) => <h2 className="spec-h2" {...props} />,
              h3: ({ node, ...props }) => <h3 className="spec-h3" {...props} />,
              h4: ({ node, ...props }) => <h4 className="spec-h4" {...props} />,
              p: ({ node, ...props }) => <p className="spec-p" {...props} />,
              ul: ({ node, ...props }) => <ul className="spec-ul" {...props} />,
              ol: ({ node, ...props }) => <ol className="spec-ol" {...props} />,
              li: ({ node, ...props }) => <li className="spec-li" {...props} />,
              code: ({ node, inline, className, children, ...props }) =>
                inline ? (
                  <code className="spec-code-inline" {...props}>{children}</code>
                ) : (
                  <pre className="spec-code-block">
                    <code className={className} {...props}>{children}</code>
                  </pre>
                ),
              table: ({ node, ...props }) => <table className="spec-table" {...props} />,
              thead: ({ node, ...props }) => <thead className="spec-thead" {...props} />,
              tbody: ({ node, ...props }) => <tbody className="spec-tbody" {...props} />,
              tr: ({ node, ...props }) => <tr className="spec-tr" {...props} />,
              th: ({ node, ...props }) => <th className="spec-th" {...props} />,
              td: ({ node, ...props }) => <td className="spec-td" {...props} />,
              blockquote: ({ node, ...props }) => <blockquote className="spec-blockquote" {...props} />,
              a: ({ node, href, ...props }) => (
                <a href={href} className="spec-link" target="_blank" rel="noopener noreferrer" {...props} />
              ),
            }}
          >
            {spec}
          </ReactMarkdown>
          {isStreaming && <span className="streaming-cursor">▋</span>}
        </div>
      </div>

      <ChatRefinement
        chatHistory={chatHistory}
        onRefineSubmit={onRefineSubmit}
        error={error}
        disabled={isStreaming}
      />
    </div>
  );
}

export default SpecViewer;
