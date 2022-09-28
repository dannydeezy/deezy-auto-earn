# deezy-auto-earn
automatically open channels to deezy, push sats through, and earn

## setup
```
git clone git@github.com:dannydeezy/deezy-auto-earn.git
cd deezy-auto-earn
cp sample-config.json config.json
npm i
```

## run once
```
node index.js
```

## run continously (recommended)
it is recommended to run this as a systemd service.
note: you may need to edit the `deezy-auto-earn-example.service` file and change the username from ubuntu to your preferred user.
```
sudo cp deezy-auto-earn-example.service /etc/systemd/system/deezy-auto-earn.service
sudo systemctl enable deezy-auto-earn.service
sudo systemctl start
```
to follow the logs:
```
journalctl -fu deezy-auto-earn -n 100
```
