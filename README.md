# Raspberry Pi temperature monitor

Temperature monitoring device for a ground source heat pump. Uses four ds18b20 temperature sensors and a Raspberry Pi Zero with wifi.

## Instructions

### Raspberry Pi setup

* Connect the sensors to the Raspberry Pi Zero according to https://www.circuitbasics.com/raspberry-pi-ds18b20-temperature-sensor-tutorial/
  * Except use a 10kohm resistor instead of a 4.7kohm one.
* Write the basic Raspberry Pi OS image on an SD card.
* Connect power, display, mouse and a keyboard to the Raspi and start it up.
* Go through the initial setup:
  * Set region/language
  * Create a user account called “monitor”
  * Set up wifi network
  * Reboot
* Start a terminal and run raspi-config
  * System options -> Boot / auto login -> Select non-auto-login CLI
  * Interface options: Enable SSH
* Reboot again

### Install Node.js

Instructions from  https://pimylifeup.com/raspberry-pi-nodejs/

```
sudo apt install -y ca-certificates curl gnupg
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /usr/share/keyrings/nodesource.gpg
NODE_MAJOR=20
echo "deb [signed-by=/usr/share/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
sudo apt update
sudo apt install nodejs
```

### Copy the script files

Copy the following files from the repository root to:

```
/home/monitor/monitor/server.js
/home/monitor/monitor/reader.js
/home/monitor/monitor/enable.sh
```

And then:

```
chmod +x /home/monitor/monitor/enable.sh
```

Go to `/sys/bus/w1/devices/` and run `ls`. You should see your temperature sensors as directories named `28-xxxxxxxxxxxx`. Edit reader.js, and replace the “files” array values with the ids of your sensors.

### Add cron jobs

Add cronjobs in /etc/cron.d/monitor:

```
@reboot /home/monitor/monitor/enable.sh # runs required setup commands on boot
0 5 * * * monitor find /home/monitor/monitor/logs/ -type f -mtime +90 -delete # Cleans up old log files, change the number of days "90" to what you want
* * * * * monitor /usr/bin/node /home/monitor/monitor/reader.js # Reads the sensors once a minute and saves data to log file
@reboot /usr/bin/node /home/monitor/monitor/server.js & # Runs the server on startup
```

### Test

Reboot the Raspberry Pi. Check its IP address, and try to access the monitor at for example http://192.168.0.10:8080
