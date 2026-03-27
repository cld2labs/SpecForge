const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const ERROR_MESSAGES = {
  MISSING_API_KEY: 'A required API key is not configured. Check your .env file.',
  ANTHROPIC_ERROR: 'The AI service returned an error. Verify your Anthropic API key.',
  BRAVE_ERROR: 'Could not fetch search results. Verify your Brave API key.',
  FIRECRAWL_ERROR: 'Could not fetch reference content. The spec will be generated without external sources.',
  TIMEOUT: 'The request timed out. This may be a network issue — please try again.',
  GENERIC: 'Something went wrong. Please try again.',
};

function parseErrorMessage(error) {
  if (error.response) {
    const detail = error.response.data?.detail || '';

    if (detail.includes('API_KEY') || detail.includes('not configured')) {
      return ERROR_MESSAGES.MISSING_API_KEY;
    }

    if (detail.includes('Anthropic')) {
      return ERROR_MESSAGES.ANTHROPIC_ERROR;
    }

    if (detail.includes('Brave')) {
      return ERROR_MESSAGES.BRAVE_ERROR;
    }

    if (detail.includes('Firecrawl')) {
      return ERROR_MESSAGES.FIRECRAWL_ERROR;
    }

    return detail || ERROR_MESSAGES.GENERIC;
  }

  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT;
  }

  return ERROR_MESSAGES.GENERIC;
}

export async function generateSpec(idea, answers) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idea, answers }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw { response: { data: errorData } };
    }

    return await response.json();
  } catch (error) {
    throw new Error(parseErrorMessage(error));
  }
}

export async function generateSpecStreaming(idea, answers, callbacks) {
  try {
    console.log('[API] Starting streaming request...');
    const response = await fetch(`${API_BASE_URL}/api/generate/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idea, answers }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw { response: { data: errorData } };
    }

    console.log('[API] Stream response received, starting to read...');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log('[API] Stream complete');
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith('event:')) {
          const event = line.substring(6).trim();

          // Look for the next data line
          if (i + 1 < lines.length && lines[i + 1].startsWith('data:')) {
            const data = lines[i + 1].substring(5).trim();
            i++; // Skip the data line in next iteration

            console.log(`[API] Event: ${event}, Data length: ${data.length}`);

            if (event === 'status' && callbacks.onStatus) {
              try {
                const parsed = JSON.parse(data);
                callbacks.onStatus(parsed.message);
              } catch (e) {
                console.error('Failed to parse status data:', e);
              }
            } else if (event === 'spec_chunk' && callbacks.onChunk) {
              callbacks.onChunk(data);
            } else if (event === 'complete' && callbacks.onComplete) {
              try {
                const parsed = JSON.parse(data);
                callbacks.onComplete(parsed);
              } catch (e) {
                console.error('Failed to parse complete data:', e);
              }
            } else if (event === 'error' && callbacks.onError) {
              try {
                const parsed = JSON.parse(data);
                callbacks.onError(parsed.message);
              } catch (e) {
                console.error('Failed to parse error data:', e);
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('[API] Stream error:', error);
    if (callbacks.onError) {
      callbacks.onError(parseErrorMessage(error));
    }
    throw new Error(parseErrorMessage(error));
  }
}

export async function refineSpec(sessionId, currentSpec, chatHistory, message) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/refine`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        current_spec: currentSpec,
        chat_history: chatHistory,
        message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw { response: { data: errorData } };
    }

    return await response.json();
  } catch (error) {
    throw new Error(parseErrorMessage(error));
  }
}
