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

# Run as non-root (node uid=1000) so --dangerously-skip-permissions works in sandbox
RUN mkdir -p /home/node/.claude/debug && chown -R node:node /home/node/.claude
RUN mkdir -p /etc/claude-code && echo '{}' > /etc/claude-code/managed-settings.json
WORKDIR /workspace
RUN mkdir -p /workspace/sandbox && chown -R node:node /workspace

USER node

CMD ["pytest", "tests/"]
