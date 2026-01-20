# Build stage
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build args for environment variables
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_PEERJS_HOST
ARG VITE_PEERJS_PORT=443
ARG VITE_PEERJS_PATH=/peerjs

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_PEERJS_HOST=$VITE_PEERJS_HOST
ENV VITE_PEERJS_PORT=$VITE_PEERJS_PORT
ENV VITE_PEERJS_PATH=$VITE_PEERJS_PATH

RUN npm run build

# Runtime stage
FROM nginx:alpine

# Backend URL for proxy (can be internal docker name or public URL)
ARG BACKEND_URL=http://backend:8080

# Remove ALL default nginx configs to avoid conflicts
RUN rm -rf /etc/nginx/conf.d/* && \
    rm -f /etc/nginx/nginx.conf.default

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Ensure index.html exists
RUN test -f /usr/share/nginx/html/index.html || (echo "ERROR: index.html not found!" && exit 1)

# Create nginx config template
RUN cat > /etc/nginx/conf.d/default.conf.template << 'NGINX_EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Proxy API requests to backend service
    location /api/ {
        proxy_pass BACKEND_URL_PLACEHOLDER/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_read_timeout 60s;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
NGINX_EOF

# Replace placeholder with actual backend URL
RUN sed "s|BACKEND_URL_PLACEHOLDER|${BACKEND_URL}|g" /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && \
    rm /etc/nginx/conf.d/default.conf.template

# Verify files and config
RUN ls -la /usr/share/nginx/html && cat /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:80/health || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
