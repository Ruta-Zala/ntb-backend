import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import connectToDB from './doc-db/database.js';
import blogRoutes from './routes/blogRoutes.js';
import axios from 'axios';
import utils from './utils/index.js';
import usersRoutes from './routes/users.js';
import usersSearchByEmailRoutes from './routes/search-user.js';
import PresignedUrl from './routes/presignedurlRoutes.js';
import websitesetting from './routes/websitesetting.js';
import menu from './routes/menuRoutes.js';

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
app.use(express.json());
connectToDB();
app.use(cors(corsOptionsDelegate));

// JWT Validation Middleware
const jwtValidationMiddleware = async (req, res, next) => {
  let proceed = false;
  try {
    if (
      req.path === '/' ||
      req.path.startsWith('/api/v1/blogs') ||
      req.path.startsWith('/api/v1/website') ||
      req.path.startsWith('/api/v1/menu') ||
      req.path.startsWith('/api/v1/presigned-url')
    ) {
      return next();
    }

    const authorizationHeader = req.headers['authorization'];
    if (authorizationHeader) {
      const incomingJwtToken = await utils.getJWT(req);
      if (incomingJwtToken) {
        const headers = { Authorization: `Bearer ${incomingJwtToken}` };
        const response = await axios.get(
          'https://auth-validate.wbx.ninja/cortex/validate',
          { headers },
        );

        if (response.status === 200) {
          proceed = true;
        }
      }
    }

    if (!proceed) {
      return res.sendStatus(401);
    }
  } catch (error) {
    console.log('JWT Validation failed:', error.message);
    return res.sendStatus(401);
  }

  next();
};

app.use(jwtValidationMiddleware);

/* Routes */
app.use('/api/v1/website', websitesetting);
app.use('/api/v1/presigned-url', PresignedUrl);
app.use('/api/v1/menu', menu);
app.use('/api/v1/blogs', blogRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/usersSearchByEmail', usersSearchByEmailRoutes);

app.use((req, res) => {
  res.status(404).send('Route not found!');
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

server.keepAliveTimeout = 60000;

export { app, server };
