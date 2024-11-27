import model from '../models/users.js';
import { db, ObjectId } from '../models/db.js';
import utils from '../utils/index.js';

export const getAllUsers = async (req, res) => {
  try {
    const users = await model.find();
    if (users.length > 0) {
      return res.status(200).send(users);
    } else {
      return res.status(404).send('No users found');
    }
  } catch (e) {
    return res.status(500).send(e.message);
  }
};

export const getUserById = async (req, res) => {
  try {
    const jwt = utils.getUsersJwt(req);
    const isUser = jwt.email === req.body.email;
    if (isUser) {
      const query = { _id: new ObjectId(req.params.id) };
      const results = await model.findOne(query);
      if (results) {
        return res.status(200).send(results);
      } else {
        const message = `No user found matching id ${req.params.id}`;
        return res.status(404).send(message);
      }
    } else {
      return res.status(403).send('You do not have access to this resource');
    }
  } catch (e) {
    return res.status(500).send(e.message);
  }
};

export const createUser = async (req, res) => {
  try {
    const jwt = utils.getUsersJwt(req);
    const isUser = jwt.email === req.body.email;

    if (utils.isObjectEmpty(req.body)) {
      return res.status(400).send('Failed to create new User. Data missing.');
    }

    if (isUser) {
      const {
        email,
        firstName,
        lastName,
        displayName,
        agreementAccepted,
        avatar,
        isEnabled,
        locale,
        accessLevel,
      } = req.body;
      const createdAt = new Date();
      const updatedAt = new Date();

      await model.insertOne({
        email,
        firstName,
        lastName,
        displayName,
        agreementAccepted,
        avatar,
        isEnabled,
        locale,
        accessLevel,
        createdAt,
        updatedAt,
      });
      return res.status(201).send();
    } else {
      return res.status(403).send('You do not have access to this resource');
    }
  } catch (e) {
    return res.status(500).send(`Failed to create new User: ${e.message}`);
  }
};

export const updateUser = async (req, res) => {
  try {
    const jwt = utils.getUsersJwt(req);

    console.log('User ID from URL:', req.params.id);

    const isUserAuthorized =
      jwt.email === req.body.email || jwt.accessLevel === 'admin';

    if (!isUserAuthorized) {
      return res.status(403).send('You do not have access to this resource');
    }

    if (utils.isObjectEmpty(req.body)) {
      return res.status(400).send('Failed to update User. Data missing.');
    }

    const userId = req.params.id;
    if (!ObjectId.isValid(userId)) {
      return res.status(400).send(`Invalid user ID: ${userId}`);
    }

    const query = { _id: new ObjectId(userId) };
    const updates = { ...req.body, updatedAt: new Date() };
    const results = await db.updateOne(
      'networking_toolbox_data',
      'users',
      query,
      { $set: updates },
    );

    if (results.matchedCount === 0) {
      return res.status(404).send(`No user found matching _id ${userId}`);
    }

    return res.status(200).send({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    return res
      .status(500)
      .send(
        'Server error. Please contact an administrator if you continue to see this error.',
      );
  }
};

export const deleteUser = async (req, res) => {
  try {
    if (!req.query.id || !req.query.id.length) {
      return res
        .status(400)
        .send('Invalid input. id is a required URL query parameter.');
    }

    const jwt = utils.getUsersJwt(req);
    const isUser = jwt.email === req.body.email;

    if (isUser) {
      const query = { _id: new ObjectId(req.query.id) };
      const results = await model.removeOne(query);

      if (results.acknowledged && results.deletedCount === 1) {
        return res.status(200).send();
      } else {
        return res
          .status(404)
          .send(`No user found matching _id ${req.query.id}`);
      }
    } else {
      return res.status(403).send('You do not have access to this resource');
    }
  } catch (e) {
    return res.status(500).send(e.message);
  }
};
