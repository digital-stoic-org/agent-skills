FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g @anthropic-ai/claude-code

# Pre-accept TOS to avoid interactive hang in non-TTY container
RUN echo "y" | claude --version || true

RUN python3 -m pip install --break-system-packages \
    pytest \
    pytest-json-report \
    pyyaml

WORKDIR /workspace

CMD ["pytest", "tests/"]
