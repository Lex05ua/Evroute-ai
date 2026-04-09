#!/bin/bash
# Quick start script for EVRoute AI backend

set -e

# Check .env exists
if [ ! -f .env ]; then
    echo "❌ .env not found! Copy .env.example and fill in your API keys:"
    echo "   cp .env.example .env"
    exit 1
fi

# Create venv if needed
if [ ! -d venv ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "📦 Installing dependencies..."
pip install -r requirements.txt -q

echo "🚀 Starting EVRoute AI backend on http://localhost:8000"
echo "📖 API docs: http://localhost:8000/docs"
echo ""
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
