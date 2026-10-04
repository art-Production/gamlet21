# Гамлет XXI века — сервер игры. Внешних зависимостей нет, нужен только Node.js.
FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0

WORKDIR /app
COPY package.json server.js logic.js index.html ./

# Запуск не от root
USER node

# App Platform берёт порт из EXPOSE
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/ping" || exit 1

CMD ["node", "server.js"]
