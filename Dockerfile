FROM node
WORKDIR /home/
RUN mkdir -p build/server build/client && touch build/server/index.js
RUN apt-get update -y
RUN apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev -y
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install --build-from-source
COPY . .
CMD npm start