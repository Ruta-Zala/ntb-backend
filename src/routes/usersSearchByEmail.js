import express from 'express';
import { findUserByEmail } from '../controllers/usersSearchByEmailController.js';

const router = express.Router();

router.get('/:email', findUserByEmail);

export default router;
