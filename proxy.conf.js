'use strict';

const { HttpsProxyAgent } = require('https-proxy-agent');

/*
 * API proxy configuration.
 * This allows you to proxy HTTP request like `http.get('/api/stuff')` to another server/port.
 * This is especially useful during app development to avoid CORS issues while running a local server.
 * For more details and options, see https://github.com/angular/angular-cli#proxy-to-backend
 */
const proxyConfig = [
  {
    context: '/fineract-provider',
    target: 'https://localhost:8443',
    changeOrigin: true,
    secure: false, // Bypass SSL certificate verification for self-signed certs
    logLevel: 'debug',
    onProxyRes: function(proxyRes, req, res) {
      // Ensure proper headers are forwarded
      proxyRes.headers['access-control-allow-origin'] = '*';
      proxyRes.headers['access-control-allow-credentials'] = 'true';
    },
    onError: function(err, req, res) {
      console.error('Proxy error:', err);
      res.writeHead(500, {
        'Content-Type': 'text/plain'
      });
      res.end('Proxy error: ' + err.message);
    }
  }
];

/*
 * Configures a proxy agent for the API proxy if needed.
 */
function setupForProxy(proxyConfig) {
  if (!Array.isArray(proxyConfig)) {
    proxyConfig = [proxyConfig];
  }

  const proxyServer = process.env.http_proxy || process.env.HTTP_PROXY;
  let agent = null;

  if (proxyServer) {
    console.log(`Using proxy server: ${proxyServer}`);
    agent = new HttpsProxyAgent(proxyServer);
    proxyConfig.forEach((entry) => {
      entry.agent = agent;
    });
  } else {
    console.warn('No proxy server configured. API requests will not be proxied.');
  }

  return proxyConfig;
}

module.exports = setupForProxy(proxyConfig);
