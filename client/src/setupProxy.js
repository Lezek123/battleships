const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    app.use(createProxyMiddleware('/reveal/**', { target: 'http://localhost:8000' }));
}
