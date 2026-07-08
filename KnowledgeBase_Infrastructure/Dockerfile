FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build
RUN echo "BUILD_TS=2026-07-08" > /tmp/build_ts

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 8080
ENV PORT=8080
CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:8080", "--no-clipboard"]
