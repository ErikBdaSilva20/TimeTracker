# Gateway local de desenvolvimento (não usar em produção)
FROM node:20-alpine
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY server.mjs ./

EXPOSE 8787
CMD ["node", "server.mjs"]
