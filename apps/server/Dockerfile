FROM node:20-alpine
RUN apk add --no-cache curl bash python3 make g++ build-base
RUN ln -sf /usr/bin/python3 /usr/bin/python
RUN adduser -D user
WORKDIR /home/server/
COPY --chown=user:user . .
RUN npm install -g pnpm
RUN pnpm install
RUN mkdir -p /home/server/user \
    && chown -R user:user /home/server/user \
    && chmod -R 700 /home/server/user
USER user
EXPOSE 9000
CMD ["pnpm", "dev"]
