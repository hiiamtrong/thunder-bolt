FROM node:14-alpine
WORKDIR /usr/local/app/thunder-bolt
COPY package*.json ./
RUN npm install
COPY . .

CMD yarn start:dev