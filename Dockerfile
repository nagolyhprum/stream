FROM node
WORKDIR /home/
RUN apt-get update -y
RUN apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev -y
RUN npm i -g nodemon
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install --build-from-source
COPY . .
CMD nodemon index.js