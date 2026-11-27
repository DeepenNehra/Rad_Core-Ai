FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install minimal system dependencies for Pillow / psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install CPU-only PyTorch first to keep image lightweight for cloud deployment
RUN pip install --upgrade pip && \
    pip install torch --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt ./
RUN pip install fastapi>=0.110.0 \
    "uvicorn[standard]>=0.28.0" \
    pydantic>=2.6.0 \
    python-multipart>=0.0.9 \
    PyJWT>=2.8.0 \
    bcrypt>=4.0.1 \
    transformers>=4.40.0 \
    pillow>=10.0.0 \
    numpy>=1.24.0 \
    pydicom>=2.4.0 \
    sqlalchemy>=2.0.0 \
    psycopg2-binary>=2.9.9

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
