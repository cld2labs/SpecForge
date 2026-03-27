import React, { useState } from 'react';

function DownloadPanel({ isOpen, onClose, spec }) {
  const [filename, setFilename] = useState('SPEC');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleDownload = () => {
    const blob = new Blob([spec], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename || 'SPEC'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(spec);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="download-overlay" onClick={onClose} />
      <div className="download-panel">
        <div className="download-header">
          <h3 className="download-title">Download your spec</h3>
          <button
            className="download-close-button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="download-content">
          <div className="download-filename-group">
            <label htmlFor="filename" className="label">
              Filename
            </label>
            <div className="download-filename-input-wrapper">
              <input
                id="filename"
                type="text"
                className="input download-filename-input"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="SPEC"
              />
              <span className="download-filename-extension">.md</span>
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="button button-primary download-button-primary"
          >
            Download {filename || 'SPEC'}.md
          </button>

          <button
            onClick={handleCopyToClipboard}
            className="button button-secondary download-button-secondary"
          >
            {copySuccess ? 'Copied!' : 'Copy to clipboard'}
          </button>
        </div>
      </div>
    </>
  );
}

export default DownloadPanel;
