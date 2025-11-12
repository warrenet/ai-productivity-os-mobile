FROM node:18-alpine
WORKDIR /app
COPY server.js ./
RUN npm install express body-parser dotenv
EXPOSE 3000
CMD ["node", "server.js"]
