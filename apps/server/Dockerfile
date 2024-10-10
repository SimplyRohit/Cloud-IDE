FROM node:22-alpine
RUN apk add --no-cache curl bash python3 make g++ build-base
RUN ln -sf /usr/bin/python3 /usr/bin/python
WORKDIR /home/server/
COPY  . .
RUN npm install
EXPOSE 9000
CMD ["npm", "run" , "dev"]