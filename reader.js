/**
 * Reads the temperature sensor readings and writes them to a file
 * accompanied by a timestamp.
 */

const fs = require('fs');
const { sendTelegram } = require('./notify');

// Use this for testing while developing.
//const files = [
  //'test/0',
  //'test/3',
  //'test/9',
  //'test/e',
//];

// Change these to match the ids of your sensors.
const files = [
  '/sys/bus/w1/devices/28-3ce1d4430fca/w1_slave',
  '/sys/bus/w1/devices/28-3ce1d443385f/w1_slave',
  '/sys/bus/w1/devices/28-3ce1d4439c0d/w1_slave',
  '/sys/bus/w1/devices/28-3ce1d443e3fa/w1_slave',
];

const temperatureLimitForAlert = 38;
const temperatureLimitForResettingAlert = 44;
const flagFile = `${__dirname}/alertSent`;

const sendAlert = async (temperature) => {
  const ok = await sendTelegram(
    `Veden lämpötila on pudonnut alle ${temperatureLimitForAlert} asteen (nyt ${temperature} °C).`
  );

  // Mark the alert as sent only if it was delivered, so failures are retried
  if (ok) {
    fs.writeFileSync(flagFile, '', { flag: 'w' });
  }
}

let entry = '';
const d = new Date();
const timestamp = d.toISOString().substring(0, 19);
const today = timestamp.substring(0, 10);
entry += timestamp;

for (const file of files) {
  const contents = fs.readFileSync(file).toString();
  const lineTwo = contents.split("\n")[1];
  const temperature = lineTwo.substring(lineTwo.indexOf("t=") + 2) / 1000;

  entry += ',' + temperature;

  // This is the sensor for water coming from the heater
  if (file === '/sys/bus/w1/devices/28-3ce1d4439c0d/w1_slave') {
    // Check the temperature and trigger an alert if it has dropped too low
    if (temperature < temperatureLimitForAlert) {
      if (!fs.existsSync(flagFile)) {
        sendAlert(temperature);
      }
    }

    // Reset the alert status once temperature is up again
    if (temperature > temperatureLimitForResettingAlert) {
      if (fs.existsSync(flagFile)) {
        fs.unlinkSync(flagFile);
      }
    }
  }
}

fs.writeFileSync(`${__dirname}/logs/${today}.log`, entry + '\n', { flag: 'a' });
