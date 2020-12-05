FROM node:14.15.0

WORKDIR /usr/src/app
COPY package*.json ./

RUN npm install

COPY . .

CMD [ "node", "src/index.js" ]