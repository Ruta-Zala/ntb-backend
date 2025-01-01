import model from '../models/users.js';
import { ObjectId } from '../models/db.js';
import utils from '../utils/index.js';

export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    console.log(
      `Received pagination parameters: page=${page}, limit=${limit}, skip=${skip}`,
    );

    // Pagination options
    const options = { skip, limit };

    const users = await model.find({}, {}, options);

    const totalUsers = await model.countDocuments({});
    const totalPages = Math.ceil(totalUsers / limit);

    console.log(`Total Users: ${totalUsers}, Total Pages: ${totalPages}`);

    return res.status(200).json({
      users,
      totalUsers,
      totalPages,
      currentPage: page,
      pageSize: limit,
    });
  } catch (e) {
    console.error(`Error occurred: ${e.message}`);
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
    // First, check if data is missing
    if (Object.keys(req.body).length === 0) {
      return res.status(400).send('Failed to create new User. Data missing.');
    }

    // Then, handle JWT and authorization
    const jwt = utils.getUsersJwt(req);
    const isUser = jwt.email === req.body.email;

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
    const userId = req.params.id;
    if (!ObjectId.isValid(userId)) {
      return res.status(400).send(`Invalid user ID: ${userId}`);
    }

    const jwt = utils.getUsersJwt(req);

    const isUserAuthorized =
      jwt.email === req.body.email || jwt.accessLevel === 'admin';

    if (!isUserAuthorized) {
      return res.status(403).send('You do not have access to this resource');
    }

    if (utils.isObjectEmpty(req.body)) {
      return res.status(400).send('Failed to update User. Data missing.');
    }

    const query = { _id: new ObjectId(userId) };
    const updates = { ...req.body, updatedAt: new Date() };
    const results = await model.updateOne(query, { $set: updates });

    if (results.matchedCount === 0) {
      return res.status(404).send(`No user found matching _id ${userId}`);
    }

    const updatedUser = await model.findOne(query);
    return res
      .status(200)
      .send({ message: 'User updated successfully', updatedUser });
  } catch (e) {
    res.status(500).send(`Error updating user: ${e.message}`);
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId || !userId.length) {
      return res
        .status(400)
        .send('Invalid input. id is a required URL parameter.');
    }

    const jwt = utils.getUsersJwt(req);
    const isUser = jwt.email === req.body.email;

    if (isUser) {
      const query = { _id: new ObjectId(userId) };
      const results = await model.removeOne(query);

      if (results.acknowledged && results.deletedCount === 1) {
        return res.status(200).send('user deleted successfully');
      } else {
        return res.status(404).send(`No user found matching _id ${userId}`);
      }
    } else {
      return res.status(403).send('You do not have access to this resource');
    }
  } catch (e) {
    return res.status(500).send(`Error deleting user: ${e.message}`);
  }
};
