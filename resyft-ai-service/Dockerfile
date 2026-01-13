# Resyft AI Service Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy and install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY main.py .

# Railway sets PORT env var
ENV PORT=8001
EXPOSE 8001

# Start with python directly (more reliable)
CMD python -c "import uvicorn; import os; uvicorn.run('main:app', host='0.0.0.0', port=int(os.getenv('PORT', 8001)))"
