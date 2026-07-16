FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY tsconfig.json ./
COPY src/ ./src/
RUN npx tsc

COPY public/ ./public/

EXPOSE 3000

CMD ["node", "dist/index.js"]
