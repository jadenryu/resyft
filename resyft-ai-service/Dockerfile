# Resyft AI Service Dockerfile
# Optimized for production deployment with vector database integration

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash resyft && \
    chown -R resyft:resyft /app
USER resyft

# Set default port (Railway will override via PORT env var)
ENV PORT=8001

# Expose port
EXPOSE 8001

# Run the application - Railway sets PORT env var
CMD uvicorn main:app --host 0.0.0.0 --port $PORT