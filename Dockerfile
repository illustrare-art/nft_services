FROM node:14

WORKDIR /app
RUN apt-get -y update


COPY ./ ./
RUN npm install
RUN cd functions && npm install

CMD ["npm","run","emulators:start"]