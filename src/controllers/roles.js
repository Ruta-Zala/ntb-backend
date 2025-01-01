import model from '../models/roles.js';
import { db, ObjectId } from '../models/db.js';

export const getAllRoles = async (req, res) => {
  try {
    // Extract pagination parameters from the query string
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
    const skip = (page - 1) * limit; // Calculate the number of items to skip based on the page

    // Log pagination parameters for debugging
    console.log(
      `Received pagination parameters: page=${page}, limit=${limit}, skip=${skip}`,
    );

    // Pagination options
    const options = { skip, limit };

    // Fetch paginated roles
    const roles = await model.find({}, {}, options);

    // Count total roles for calculating total pages
    const totalRoles = await model.countDocuments({});
    const totalPages = Math.ceil(totalRoles / limit);

    // If roles are found, return paginated data with metadata
    if (roles.length > 0) {
      return res.status(200).json({
        roles,
        totalRoles,
        totalPages,
        currentPage: page,
        pageSize: limit,
      });
    } else {
      // If no roles found, return a 404 error
      return res.status(404).send('No roles found');
    }
  } catch (e) {
    // Handle server errors
    console.error(`Error occurred: ${e.message}`);
    return res.status(500).send(e.message);
  }
};

export const createRole = async (req, res) => {
  try {
    const {
      id,
      name,
      role,
      description,
      isEnabled,
      permissionTypeId,
      createdBy,
      updatedBy,
    } = req.body;

    const createdAt = new Date();
    const updatedAt = new Date();

    await model.insertOne({
      id,
      name,
      role,
      description,
      isEnabled,
      permissionTypeId,
      createdBy,
      createdAt,
      updatedBy,
      updatedAt,
    });
    return res.status(201).send();
  } catch (e) {
    return res.status(500).send(`Failed to create new role: ${e.message}`);
  }
};

export const updateRole = async (req, res) => {
  try {
    const query = { _id: new ObjectId(req.params.id) };
    const body = { ...req.body };
    delete body._id;

    const results = await db.replaceOne(
      'trialReportsData',
      'Role',
      query,
      body,
    );
    if (results.lastErrorObject.n === 1) {
      return res.status(200).send(results.value);
    } else {
      const message = `No role found matching id ${req.params.id}`;
      return res.status(400).send(message);
    }
  } catch (e) {
    return res
      .status(500)
      .send(
        console.error(e),
        'Server error. Please contact an administrator if you continue to see this error.',
      );
  }
};
