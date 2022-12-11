FROM alpine:3.17 AS build-env

RUN apk add --update --no-cache git

RUN git clone --depth 1 https://github.com/dannydeezy/deezy-auto-earn /deezy-auto-earn

FROM node:current-alpine

COPY --from=build-env /deezy-auto-earn/ /deezy-auto-earn/
COPY entrypoint.sh entrypoint.sh

RUN cd /deezy-auto-earn \
    && npm i \
    && chmod +x /entrypoint.sh

VOLUME [ "/lnd", "/config" ]

WORKDIR /deezy-auto-earn

ENTRYPOINT [ "/entrypoint.sh" ]