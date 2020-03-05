FROM node:lts-alpine



WORKDIR /app

COPY ./app /app

EXPOSE 3000
EXPOSE 443

RUN npm install

ENTRYPOINT ["node", "server.js"]