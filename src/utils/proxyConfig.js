// src/utils/proxyConfig.js

function getProxy() {
  return global.savedProxy || '';
}

function setProxy(proxy) {
  global.savedProxy = proxy;
}

module.exports = { getProxy, setProxy };
