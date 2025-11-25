FROM node:18-alpine
WORKDIR /app

COPY pepimovil-backend/package*.json ./
RUN npm install --production

COPY pepimovil-backend/src ./src

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node","src/server.js"]
