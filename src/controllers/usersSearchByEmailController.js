import model from '../models/users.js';
import utils from '../utils/index.js';

export const findUserByEmail = async (req, res) => {
  try {
    const query = { email: req.params.email };
    const results = await model.findOne(query);

    if (results) {
      const jwt = utils.getUsersJwt(req);
      const isUser = jwt.email === req.params.email;

      if (isUser) {
        return res.status(200).send(results);
      } else {
        const message = 'You do not have access to this resource';
        return res.status(403).send(message);
      }
    } else {
      const message = `No user found matching email ${req.params.email}`;
      return res.status(404).send(message);
    }
  } catch (e) {
    console.error('Error in findUserByEmail:', e.message);
    return res.status(500).send(e.message);
  }
};
