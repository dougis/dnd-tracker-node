import { Router } from 'express';
import { encounterCrudRoutes } from './crud-routes';
import { participantRoutes } from './participant-routes';
import { lifecycleRoutes } from './lifecycle-routes';
import { streamingRoutes } from './streaming-routes';

const router = Router();

// Mount all encounter route modules
router.use('/', encounterCrudRoutes);
router.use('/', participantRoutes);
router.use('/', lifecycleRoutes);
router.use('/', streamingRoutes);

export { router as encounterRoutes };