export default {
  parseJwt(token) {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  },

  getUsersJwt(req) {
    try {
      let incomingJwtToken, parsedToken;

      if (
        req.headers.authorization &&
        req.headers.authorization.split(' ')[0] === 'Bearer'
      ) {
        incomingJwtToken = req.headers.authorization.split(' ')[1];
        parsedToken = this.parseJwt(incomingJwtToken);
        return parsedToken;
      } else {
        const message = 'JWT Authentication Error';
        throw new Error(message);
      }
    } catch (e) {
      const message = 'JWT Authentication Error';
      console.error(e);
      throw new Error(message);
    }
  },

  getJWT(req) {
    let incomingJwtToken;
    if (
      req.headers.authorization &&
      req.headers.authorization.split(' ')[0] === 'Bearer'
    ) {
      incomingJwtToken = req.headers.authorization.split(' ')[1];
    }
    return incomingJwtToken;
  },

  isObjectEmpty(thisObject) {
    if (
      thisObject &&
      Object.keys(thisObject).length === 0 &&
      Object.getPrototypeOf(thisObject) === Object.prototype
    ) {
      return true;
    } else {
      return false;
    }
  },
};
