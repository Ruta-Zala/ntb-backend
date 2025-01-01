import express from 'express';
import { getAllRoles, createRole, updateRole } from '../controllers/roles.js';

const router = express.Router();

router.get('/', getAllRoles);
router.post('/', createRole);
router.put('/:id', updateRole);

export default router;
