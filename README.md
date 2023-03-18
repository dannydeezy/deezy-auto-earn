# deezy-auto-earn
automatically open channels to deezy, push sats through, and earn

This is my first fork. Made some changes to the Config.json and the async function maybeOpenChannel. This creates the feature request i submitted here https://github.com/dannydeezy/deezy-auto-earn/issues/12#issue-1557514653. 

## setup
```
git clone https://github.com/jtymoszczuk/deezy-auto-earn.git
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
