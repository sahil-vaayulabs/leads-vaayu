FROM node:22-alpine AS build

WORKDIR /app
COPY package.json ./
RUN npm install
COPY tsconfig.json ./
COPY src/ ./src/
RUN npx tsc

FROM node:22-alpine

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY public/ ./public/

EXPOSE 3000

CMD ["node", "dist/index.js"]
