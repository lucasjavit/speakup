FROM node:20-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S peerjs && \
    adduser -u 1001 -S peerjs -G peerjs

COPY package.json ./
RUN npm install --production

COPY server.js ./

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget -q --spider http://localhost:9000/peerjs || exit 1

USER peerjs
EXPOSE 9000

CMD ["node", "server.js"]
