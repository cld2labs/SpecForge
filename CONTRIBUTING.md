# Contributing to SpecForge

Thanks for your interest in contributing to SpecForge.

SpecForge is an open-source system design specification generator built with FastAPI, React, and a pluggable inference layer. We welcome improvements across the codebase, documentation, bug reports, and workflow enhancements.

---

## Quick Setup Checklist

```bash
# Check Python (3.11+ recommended)
python --version

# Check Node.js (18+ recommended)
node --version

# Check Docker
docker --version
docker compose version
```

---

## How do I...?

### Report a bug?

1. Search existing issues first
2. Open a GitHub issue with environment details, steps to reproduce, and expected vs actual behavior
3. Include logs, screenshots, or error messages

### Suggest a new feature?

1. Open a GitHub issue describing the feature
2. Explain the problem it solves and who it helps
3. For large changes, get alignment before writing code

### Fork and clone the repo?

```bash
# Fork on GitHub, then:
git clone https://github.com/<your-username>/SpecForge.git
cd SpecForge
git remote add upstream https://github.com/cld2labs/SpecForge.git
```

### Set up SpecForge locally?

```bash
# Configure environment
cp .env.example .env
# Edit .env with your inference provider settings

# Option 1: Docker
docker compose up --build

# Option 2: Local development
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# In another terminal:
cd frontend
npm install
npm run dev
```

---

## Branching model

- Fork the repo and base work from `main`
- Use descriptive branch names:
  - `feat/add-streaming-support`
  - `fix/ollama-timeout`
  - `docs/update-setup-guide`

---

## Commit conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(api): add timeout config for inference requests
fix(ui): resolve dark mode flash on load
docs: update provider configuration examples
```

---

## Code guidelines

- Follow existing structure and patterns
- Keep changes focused on one issue
- No secrets, API keys, or local `.env` files in commits
- Update documentation when behavior changes
- Remove debug code and commented experiments before PR

---

## Pull request checklist

- [ ] Tested locally
- [ ] Application starts successfully
- [ ] Debug code removed
- [ ] Documentation updated (if needed)
- [ ] PR scoped to one issue
- [ ] No secrets committed

---

## Thank you

Thanks for contributing to SpecForge!
