# AI Simulation Platform - Python Backend

FastAPI backend for the AI Simulation Platform.

## Requirements

- Python 3.11+
- PostgreSQL database
- OpenAI API key

## Installation

```bash
# Install dependencies with uv
uv sync

# Or with pip
pip install -e .
```

## Configuration

Copy `.env.sample` to `.env` and configure:

```bash
cp .env.sample .env
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key
- `JWT_SECRET` - Secret for JWT tokens

## Running

Development mode with hot reload:
```bash
uv run uvicorn app.main:app --reload --port 3001
```

Production:
```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 3001
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:3001/docs
- ReDoc: http://localhost:3001/redoc
