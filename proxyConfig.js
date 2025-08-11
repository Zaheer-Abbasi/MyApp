// proxyConfig.js
const proxies = new Map();

function setProxy(proxy, id = "default") {
  proxies.set(id, proxy);
}

function getProxy(id = "default") {
  return proxies.get(id) || '';
}

module.exports = { setProxy, getProxy };
