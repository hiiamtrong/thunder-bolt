FROM node:14-alpine
WORKDIR /usr/local/app/thunder-bolt
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 1235
CMD yarn start:dev