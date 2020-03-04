FROM node:lts-alpine



WORKDIR /app

COPY ./ /app

EXPOSE 3000
EXPOSE 443

ENTRYPOINT ["node", "socket.js"]