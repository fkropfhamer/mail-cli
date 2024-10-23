FROM node:22-alpine

COPY package-lock.json .
COPY package.json .
COPY src ./src

RUN npm i
RUN npm link
