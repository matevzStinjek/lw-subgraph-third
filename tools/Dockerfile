FROM node:latest

RUN apt-get update \

WORKDIR /app

COPY package.json ./

RUN yarn install

COPY src src

# Compile the contracts
RUN yarn build

CMD ["yarn start"] 
