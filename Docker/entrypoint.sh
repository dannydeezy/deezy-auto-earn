#!/bin/sh
if [ -f /config/config.json ]
then
    cp /config/config.json /config.json
    node index.js
else
    echo "Couldn't find a config file..."
    exit
fi
