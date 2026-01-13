# Resyft AI Service Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for PyMuPDF
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .

# Set default port
ENV PORT=8001

# Expose port
EXPOSE 8001

# Run the application
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
