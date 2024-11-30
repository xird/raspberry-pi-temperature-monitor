/**
 * Reads the temperature sensor readings and writes them to a file
 * accompanied by a timestamp.
 */

const fs = require('fs');
const https = require('https');

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

const temperatureLimitForAlert = 41;
const temperatureLimitForResettingAlert = 45;
const alertApiHost = 'YOUR_ALERT_API_HOST';
const alertApiPath = '/';
const flagFile = `${__dirname}/alertSent`;

const sendAlert = () => {
  const dataJson = JSON.stringify({
    temperature: temperatureLimitForAlert,
  });

  const data = Buffer.from(dataJson, 'utf-8').toString('base64');

  const options = {
    hostname: alertApiHost,
    port: 443,
    path: alertApiPath,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  };

  const req = https.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      console.log('Response:', responseData);
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error);
  });

  req.write(data);
  req.end();

  // Mark the alert as sent
  fs.writeFileSync(flagFile, '', { flag: 'w' });
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
        sendAlert();
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
