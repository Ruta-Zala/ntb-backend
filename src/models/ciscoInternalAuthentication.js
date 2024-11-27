import db from './db';

export default {
  async isCiscoInternal(jwt, options) {
    try {
      let result, querySelector;
      result = false;
      const reg = new RegExp(jwt.email, 'i');
      querySelector = {
        email: reg,
      };
      const user = await db.findOne(
        'networking_toolbox_data',
        'users',
        querySelector,
        options,
      );
      // '4' = Cisco Internal
      if (user) {
        result = user.hasOwnProperty('accessLevel') && user.accessLevel === '4'; // eslint-disable-line no-prototype-builtins
      } else {
        return false;
      }
      return result;
    } catch (e) {
      console.log('is Cisco Internal e is ', e);
      return false;
    }
  },
};
