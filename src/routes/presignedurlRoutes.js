import express from 'express';
import { getPresignedUrl } from '../controllers/presignedURL.js';

const router = express.Router();

router.get('/', getPresignedUrl);

export default router;
