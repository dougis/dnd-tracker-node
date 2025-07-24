import { Router } from 'express';
import basicRoutes from './basic-routes';
import combatRoutes from './combat-routes';
import participantRoutes from './participant-routes';
import streamRoutes from './stream-routes';

const router = Router();

// Mount all encounter route modules
router.use('/', basicRoutes);
router.use('/', combatRoutes);
router.use('/', participantRoutes);
router.use('/', streamRoutes);

// Named export for consistency with test expectations
export const encounterRoutes = router;

// Default export for use in main app
export default router;