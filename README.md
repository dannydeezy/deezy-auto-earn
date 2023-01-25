# deezy-auto-earn
automatically open channels to deezy, push sats through, and earn

## setup
```
git clone git@github.com:dannydeezy/deezy-auto-earn.git
cd deezy-auto-earn
cp sample-config.json config.json
# edit config.json with your custom values
npm i
```

## run once
```
node index.js
```

## run continously (recommended)
it is recommended to run this as a systemd service.

note you may want to make the following edits to the `deezy-auto-earn-example.service` file:
- change username from `ubuntu` to your user
- update `RestartSec` to your desired interval, which will determine how frequently the script runs

```
sudo cp deezy-auto-earn-example.service /etc/systemd/system/deezy-auto-earn.service
sudo systemctl enable deezy-auto-earn.service
sudo systemctl start deezy-auto-earn
```
note, doing `enable` means it will always start up when your machine restarts

to follow the logs:
```
journalctl -fu deezy-auto-earn -n 100
```

to stop the service:
```
sudo systemctl stop deezy-auto-earn
```

to restart the service:
```
sudo systemctl restart deezy-auto-earn
```
## run with docker

Setup config file with your custom values
```
cp sample-config.json config.json
# edit config.json with your custom values
```

Build the container

```
docker build -t deezy-auto-earn-service .
```

Run the container
```
docker run -it -p 9615:9615 -v /lnd /config --rm --name deezy-auto-earn-service-1 deezy-auto-earn-service
```