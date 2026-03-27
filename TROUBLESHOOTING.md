# Troubleshooting Guide

This document contains all common issues encountered during development and their solutions.

## Table of Contents

- [API Common Issues](#api-common-issues)
- [UI Common Issues](#ui-common-issues)

### API Common Issues

#### "API client not initialized. Check inference API configuration."

**Solution**:

1. Create a `.env` file in the root directory
2. Add your inference API credentials:
   ```
   INFERENCE_PROVIDER=remote
   INFERENCE_API_ENDPOINT=https://api.openai.com
   INFERENCE_API_TOKEN=your-api-token-here
   INFERENCE_MODEL_NAME=gpt-4o
   ```
3. Restart the server

#### "Idea too short" or validation errors

**Solution**:

- Project idea must be between 10-3000 characters
- Provide enough detail about what you want to build
- Include the problem you're solving and key features

#### Import errors

**Solution**:

1. Ensure all dependencies are installed: `pip install -r requirements.txt`
2. Verify you're using Python 3.11 or higher: `python --version`
3. Activate your virtual environment if using one

#### Server won't start

**Solution**:

1. Check if port 8000 is already in use: `lsof -i :8000` (Unix) or `netstat -ano | findstr :8000` (Windows)
2. Use a different port by updating `BACKEND_PORT` in `.env`
3. Check the logs for specific error messages

#### Spec generation returns empty result

**Solution**:

1. Verify inference API authentication is working (check `/health` endpoint)
2. Check if the model endpoint is accessible
3. Verify INFERENCE_API_TOKEN is valid and not expired
4. Try with simpler project idea first
5. Check server logs for API errors

#### "No module named 'openai'" or similar

**Solution**:

```bash
pip install -r requirements.txt
```

#### Ollama connection refused

**Solution**:

1. Ensure Ollama is running on the host: `ollama serve`
2. Verify model is pulled: `ollama list`
3. Pull model if needed: `ollama pull codellama:34b`
4. Check `INFERENCE_API_ENDPOINT=http://host.docker.internal:11434`

#### Slow spec generation

**Solution**:

1. Use a faster model (e.g., `gpt-4o-mini` instead of `gpt-4o`)
2. Reduce complexity of project idea
3. For Ollama: ensure running natively on host, not in Docker
4. Check network latency to remote endpoint

## UI Common Issues

### API Connection Issues

**Problem**: "Failed to generate" or connection errors

**Solution**:

1. Ensure the API server is running on `http://localhost:8000`
2. Check browser console for detailed errors
3. Verify CORS is enabled in the API
4. Test API directly: `curl http://localhost:8000/health`

### Build Issues

**Problem**: Build fails with dependency errors

**Solution**:

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Styling Issues

**Problem**: Styles not applying

**Solution**:

```bash
# Rebuild Tailwind CSS
npm run dev
```

### Spec Not Streaming

**Problem**: Spec appears all at once instead of streaming

**Solution**:

1. Check browser console for SSE connection errors
2. Verify backend logs show token streaming
3. Check for proxy buffering issues
4. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
