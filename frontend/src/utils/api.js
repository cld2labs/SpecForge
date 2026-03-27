const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

async function handleResponse(response) {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: response.statusText };
    }
    throw new APIError(
      errorData.detail || `HTTP ${response.status}`,
      response.status,
      errorData
    );
  }
  return response.json();
}

export async function getQuestions(idea) {
  const response = await fetch(`${API_BASE_URL}/api/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idea }),
  });
  return handleResponse(response);
}

export async function generateSpec(idea, answers, onStatus, onToken, onComplete, onError) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idea, answers }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulatedSpec = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim() || line.startsWith(':')) continue;

        if (line.startsWith('event:')) {
          const eventType = line.substring(6).trim();
          continue;
        }

        if (line.startsWith('data:')) {
          const data = JSON.parse(line.substring(5).trim());

          if (data.message) {
            onStatus?.(data.message);
          } else if (data.content) {
            accumulatedSpec += data.content;
            onToken?.(data.content);
          } else if (data.session_id) {
            // Done event - complete with accumulated spec and session_id
            onComplete?.(accumulatedSpec, data.session_id);
            return; // Exit the stream
          }
        }
      }
    }

    if (!accumulatedSpec) {
      onError?.(new Error('No spec generated'));
    }
  } catch (error) {
    onError?.(error);
  }
}

export async function refineSpec(sessionId, currentSpec, history, message) {
  const response = await fetch(`${API_BASE_URL}/api/refine`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: sessionId,
      current_spec: currentSpec,
      history,
      message,
    }),
  });
  return handleResponse(response);
}

export async function askQuestion(sessionId, currentSpec, message) {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: sessionId,
      current_spec: currentSpec,
      message,
    }),
  });
  return handleResponse(response);
}
