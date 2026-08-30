const http = require('http');

const data = JSON.stringify({
  statement: "Person A was present at Location X between 20:00 and 20:30."
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/server/vikshana_function/cases/101/hypotheses',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let chunks = [];
  res.on('data', (d) => chunks.push(d));
  res.on('end', () => console.log(Buffer.concat(chunks).toString()));
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
