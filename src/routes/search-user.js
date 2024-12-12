import express from 'express';
import { findUserByEmail } from '../controllers/search-user.js';

const router = express.Router();

router.get('/:email', findUserByEmail);

export default router;
