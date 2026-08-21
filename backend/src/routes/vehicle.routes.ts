import { Router } from 'express';
import * as vehicleController from '../controllers/vehicle.controller';
import { authenticate, attachUserIfPresent } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { uploadImages, uploadDocument } from '../middlewares/upload';
import {
  createVehicleValidator,
  updateVehicleValidator,
  searchVehiclesValidator,
  availabilityCheckValidator,
} from '../validators/vehicle.validator';

const router = Router();

// ---- Public browsing ----
router.get('/', searchVehiclesValidator, validate, vehicleController.searchVehicles);

// ---- Owner: manage own listings (must be registered before the /:id catch-all) ----
router.get('/owner/mine', authenticate, authorize('owner'), vehicleController.listMyVehicles);
router.get('/admin/pending', authenticate, authorize('admin'), vehicleController.adminListPendingVehicles);

router.post('/', authenticate, authorize('owner'), createVehicleValidator, validate, vehicleController.createVehicle);

router.get('/:id', attachUserIfPresent, vehicleController.getVehicle);
router.get('/:id/availability', availabilityCheckValidator, validate, vehicleController.checkAvailability);

router.patch(
  '/:id',
  authenticate,
  authorize('owner', 'admin'),
  updateVehicleValidator,
  validate,
  vehicleController.updateVehicle
);
router.delete('/:id', authenticate, authorize('owner', 'admin'), vehicleController.deleteVehicle);
router.post('/:id/submit-verification', authenticate, authorize('owner'), vehicleController.submitForVerification);

router.post(
  '/:id/images',
  authenticate,
  authorize('owner', 'admin'),
  uploadImages.array('images', 10),
  vehicleController.uploadVehicleImages
);
router.delete('/:id/images/:publicId', authenticate, authorize('owner', 'admin'), vehicleController.deleteVehicleImage);

router.post(
  '/:id/documents/:docType',
  authenticate,
  authorize('owner'),
  uploadDocument.single('document'),
  vehicleController.uploadVehicleDocument
);

// ---- Admin: verification decisions ----
router.post('/:id/verify', authenticate, authorize('admin'), vehicleController.adminVerifyVehicle);
router.post('/:id/reject', authenticate, authorize('admin'), vehicleController.adminRejectVehicle);

export default router;
