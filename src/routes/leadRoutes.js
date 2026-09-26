import { Router } from 'express';
import { createLead, getLeads, getLeadById } from '../controllers/leadController.js';
import { validateLeadInput } from '../middleware/validation.js';

const router = Router();

router.post('/', validateLeadInput, createLead);
router.get('/', getLeads);
router.get('/:id', getLeadById);

export default router;