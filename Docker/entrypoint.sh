#!/bin/sh
if [ -f /config/config.json ]
then
    cp /config/config.json /deezy-auto-earn/config.json
    cd /deezy-auto-earn
    node index.js
else
    echo "Couldn't find a config file..."
    exit
fi
