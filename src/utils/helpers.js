/**
 * Extract client IP address from request
 * Handles proxies and load balancers
 * @param {import('express').Request} req
 * @returns {string}
 */
export const getClientIP = (req) => {
  // Check various headers that proxies might set
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // Take the first IP in the chain (original client)
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }
  
  // Fall back to socket address
  return req.socket?.remoteAddress || 'unknown';
};

/**
 * Mask IP address for logging (privacy)
 * @param {string} ip
 * @returns {string}
 */
export const maskIP = (ip) => {
  if (ip.includes(':')) {
    // IPv6
    const parts = ip.split(':');
    return parts.slice(0, 4).join(':') + ':****';
  }
  // IPv4
  const parts = ip.split('.');
  return parts.slice(0, 2).join('.') + '.***';
};

/**
 * Deep freeze an object
 * @param {Object} obj
 * @returns {Object}
 */
export const deepFreeze = (obj) => {
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach(prop => {
    if (
      obj[prop] !== null &&
      typeof obj[prop] === 'object' &&
      !Object.isFrozen(obj[prop])
    ) {
      deepFreeze(obj[prop]);
    }
  });
  return obj;
};
