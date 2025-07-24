import { Router } from 'express';
import basicRoutes from './basic-routes';
import participantRoutes from './participant-routes';
import combatRoutes from './combat-routes';
import streamRoutes from './stream-routes';

const router = Router();

// Mount all route modules
router.use('/', basicRoutes);
router.use('/', participantRoutes);
router.use('/', combatRoutes);
router.use('/', streamRoutes);

export default router;