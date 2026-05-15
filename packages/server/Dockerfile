FROM node:22-alpine
RUN apk add --no-cache curl bash python3 make g++ build-base git libc6-compat
RUN ln -sf /usr/bin/python3 /usr/bin/python
RUN corepack enable && corepack prepare pnpm@latest --activate
ENV PNPM_SKIP_WORKER_POOL=true
WORKDIR /home/server/
COPY  . .
RUN npm install
EXPOSE 9000
CMD ["npm", "run" , "dev"]