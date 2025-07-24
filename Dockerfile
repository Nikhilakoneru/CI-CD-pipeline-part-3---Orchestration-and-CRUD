FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY server.js aws-config.js ./

EXPOSE 3000

CMD ["npm", "start"]