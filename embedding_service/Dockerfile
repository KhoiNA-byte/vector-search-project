FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for pillow / image processing if any
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download models so they are cached in the image layer
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2'); SentenceTransformer('clip-ViT-B-32')"

COPY main.py .

EXPOSE 5000

ENV PYTHONUNBUFFERED=1

CMD ["python", "main.py"]
