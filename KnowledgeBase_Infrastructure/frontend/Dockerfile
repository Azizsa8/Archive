FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/server/dist ./server
COPY --from=builder /app/dist /dist
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
USER appuser
EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001
CMD ["node", "server/index.js"]
