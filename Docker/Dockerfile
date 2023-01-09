FROM node:current-alpine

COPY ../ /

RUN npm i \
    && mv Docker/entrypoint.sh / \
    && chmod +x /entrypoint.sh

VOLUME [ "/lnd", "/config" ]

WORKDIR /

ENTRYPOINT [ "/entrypoint.sh" ]
