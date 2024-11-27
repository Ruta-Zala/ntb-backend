import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import connectToDB from './doc-db/database.js';
import blogRoutes from './routes/blogRoutes.js';
import axios from 'axios';
import utils from './utils/index.js';
import usersRoutes from './routes/users.js';
import userRoutes from './routes/user.js';
import usersSearchByEmailRoutes from './routes/usersSearchByEmail.js';

dotenv.config();

// CORS configuration
const corsAllow = [
  'https://networkingtoolbox.cisco.com',
  'http://localhost:3000',
];

const corsOptionsDelegate = function (req, callback) {
  let corsOptions;
  if (corsAllow.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true };
  } else {
    corsOptions = { origin: false };
  }
  callback(null, corsOptions);
};

const app = express();
const port =
  process.env.PORT || (process.env.NODE_ENV === 'test' ? 30002 : 30001); // Different port for test environment
app.set('port', port);

// Middleware
app.use(express.json()); // Parse JSON requests
connectToDB(); // Connect to the database
app.use(cors(corsOptionsDelegate)); // Apply CORS options

// JWT Validation Middleware (for all routes except '/' and '/api/blogs')
const jwtValidationMiddleware = async (req, res, next) => {
  let proceed = false;
  try {
    // Skip validation for the '/' and '/api/blogs' routes
    if (req.path === '/' || req.path.startsWith('/api/blogs')) {
      return next();
    }

    // Check for the Authorization header
    const authorizationHeader = req.headers['authorization'];
    if (authorizationHeader) {
      const incomingJwtToken = await utils.getJWT(req);
      if (incomingJwtToken) {
        // Validate JWT against external API
        const headers = { Authorization: `Bearer ${incomingJwtToken}` };
        const response = await axios.get(
          'https://auth-validate.wbx.ninja/cortex/validate',
          { headers },
        );

        if (response.status === 200) {
          proceed = true; // Proceed if token is valid
        }
      }
    }

    // If token is invalid or not provided, respond with Unauthorized
    if (!proceed) {
      return res.sendStatus(401); // Unauthorized
    }
  } catch (error) {
    console.log('JWT Validation failed:', error.message);
    return res.sendStatus(401); // Unauthorized on error
  }

  next(); // Continue to the next middleware/route handler
};

app.use(jwtValidationMiddleware);

/* Routes */
app.use('/api/blogs', blogRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/users', usersRoutes); // Users routes
app.use('/api/v1/usersSearchByEmail', usersSearchByEmailRoutes); // Search by email routes

// 404 Route for unmatched endpoints
app.use((req, res) => {
  res.status(404).send('Route not found!');
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Server keep-alive timeout
server.keepAliveTimeout = 60000;

export { app, server };
