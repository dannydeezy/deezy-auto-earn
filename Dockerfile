# build stage
FROM node:lts-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

FROM node:lts-alpine as production-stage
WORKDIR /app
COPY --from=build-stage /app .
RUN npm install pm2@3.5.1 -g
RUN pm2 install pm2-server-monit

EXPOSE 9615
CMD ["pm2-runtime", "index.js", "--web"]
