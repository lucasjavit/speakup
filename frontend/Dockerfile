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
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget -q --spider http://localhost:80/health || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
