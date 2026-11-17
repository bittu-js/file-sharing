const http = require('http');

function check(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ url, status: res.statusCode, data: data.substring(0, 100) }));
    }).on('error', (err) => resolve({ url, error: err.message }));
  });
}

async function main() {
  const backend = await check('http://127.0.0.1:5000/api/health');
  console.log('Backend response:', backend);

  const frontend = await check('http://localhost:5173/');
  console.log('Frontend response:', frontend);

  const proxiedBackend = await check('http://localhost:5173/api/health');
  console.log('Frontend Vite Proxy response:', proxiedBackend);
}

main();
