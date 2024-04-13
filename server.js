/**
 * Serves the main web page, as well as the JSON data file required by
 * the chart library.
 */

const http = require('http');
const fs = require('fs');

const getHtml = (dataDate) => {
  const html = `
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html style="height: 100%;" xmlns="http://www.w3.org/1999/xhtml" xml:lang="UTF-8" lang="en">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />

      <title>Temperature monitor</title>
    </head>
    <body style="height: 100%;">
      <div style="height: 100%;">
        <canvas id="myChart"></canvas>
      </div>

      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <script src="data.json?date=${dataDate}"></script>

      <script>
        const ctx = document.getElementById('myChart');

        const chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: graphData.dates,
            datasets: [
              {
                label: 'From ground',
                data: graphData.sensor_0,
                borderWidth: 1
              },{
                label: 'To ground',
                data: graphData.sensor_3,
                borderWidth: 1
              },{
                label: 'From heater',
                data: graphData.sensor_9,
                borderWidth: 1
              },{
                label: 'To heater',
                data: graphData.sensor_e,
                borderWidth: 1
              },
            ]
          },
          options: {
            layout: {
              padding: 20
            },
            maintainAspectRatio: false,
            scales: {
              y: {
                min: 0,
                max: 65,
              }
            }
          }
        });
      </script>
    </body>
  <html>
  `;

  return html;
};

const getGraphData = (dataDate) => {
  const graphData = {
    dates: [],
    sensor_0: [],
    sensor_3: [],
    sensor_9: [],
    sensor_e: [],
  };

  const fileName = `${__dirname}/logs/${dataDate}.log`;
  if (fs.existsSync(fileName)) {
    const rawData = fs.readFileSync(fileName).toString();
    const lines = rawData.split("\n");
    for (const line of lines) {
      const values = line.split(',');
      graphData.dates.push(values[0]);
      graphData.sensor_0.push(values[1]);
      graphData.sensor_3.push(values[2]);
      graphData.sensor_9.push(values[3]);
      graphData.sensor_e.push(values[4]);
    }
  }

  return graphData;
};

http.createServer(function (req, res) {
  const protocol = req.connection.encrypted ? 'https' : 'http';
  const url = new URL(`${protocol}:${req.headers.host}${req.url}`);
  const d = new Date();
  const dataDate = url.searchParams.get('date') || d.toISOString().substring(0, 10);

  switch(url.pathname) {
    // Serve main page HTML
    case '/':
      res.write(getHtml(dataDate));
      res.end();
      break;

    // Serve the graph data
    case '/data.json':
      const graphData = getGraphData(dataDate);
      res.write('const graphData = ' + JSON.stringify(graphData) + ';');
      res.end();
      break;

    default:
      res.writeHead(404);
      res.end();
      break;
  }

}).listen(8080);
