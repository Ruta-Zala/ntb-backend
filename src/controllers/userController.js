import { ObjectId } from '../models/db.js';
import model from '../models/user.js';
import utils from '../utils/index.js';

export const updateUser = async (req, res) => {
  try {
    const jwt = utils.getUsersJwt(req);

    if (utils.isObjectEmpty(req.body)) {
      const message = 'Failed to update User. Data missing.';

      return res.status(500).send(message);
    }

    const isUser = jwt.email === req.body.email;
    if (isUser) {
      const filter = {
        _id: new ObjectId(req.params._id),
      };

      if (req.body.setLastLogin && req.body.setLastLogin === true) {
        const lastLoggedInAt = new Date();
        const update = { $set: { lastLoggedInAt } };
        const results = await model.updateOne(filter, update);

        if (
          results.acknowledged &&
          results.modifiedCount === 1 &&
          results.matchedCount === 1
        ) {
          return res.status(200).send();
        } else {
          const message = `No user found matching _id ${req.params._id}`;
          return res.status(400).send(message);
        }
      }

      if (req.body.setUserCompany && req.body.setUserCompany === true) {
        const update = { $set: { company: req.body.company } };
        const results = await model.updateOne(filter, update);

        if (
          results.acknowledged &&
          results.modifiedCount === 1 &&
          results.matchedCount === 1
        ) {
          return res.status(200).send();
        } else {
          const message = `No user found matching _id ${req.params._id}`;
          return res.status(400).send(message);
        }
      }

      const body = req.body;
      body.updatedAt = new Date();
      delete body._id;

      const results = await model.replaceOne('users', filter, body);

      if (results.lastErrorObject.n === 1) {
        return res.status(200).send(results.value);
      } else {
        const message = `No user found matching _id ${req.params._id}`;
        return res.status(400).send(message);
      }
    } else {
      const message = 'You do not have access to this resource';
      return res.status(403).send(message);
    }
  } catch (e) {
    console.error('Error:', e);
    return res
      .status(500)
      .send(
        'Server error u100. Please contact an administrator if you continue to see this error.',
      );
  }
};
