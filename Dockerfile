FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install the build dependencies first
RUN pip install --no-cache-dir setuptools wheel

COPY pyproject.toml .
# Remove the -e flag for production container builds
RUN pip install --no-cache-dir .

COPY . .