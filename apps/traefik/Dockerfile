FROM node:alpine
WORKDIR /home/node
COPY package*.json ./
RUN npm install
COPY src ./
COPY tsconfig.json ./
EXPOSE 8080
CMD ["npm", "run", "dev"]
