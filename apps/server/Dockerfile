FROM node:20-alpine
RUN apk add --no-cache curl bash python3
RUN ln -sf /usr/bin/python3 /usr/bin/python
RUN adduser -D user
WORKDIR /home/server/
COPY --chown=user:user . .
RUN npm install -g pnpm
RUN pnpm install
RUN chown -R user:user /home/server
USER user
EXPOSE 9000
CMD ["pnpm", "dev"]
