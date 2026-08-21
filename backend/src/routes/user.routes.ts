import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { asyncHandler } from '../utils/asyncHandler';
import { User } from '../models/User.model';
import { AuditLog } from '../models/AuditLog.model';
import { ApiError } from '../utils/ApiError';
import { createNotification } from '../services/notification.service';

const router = Router();

// Any authenticated user can read/update their own profile.
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!.id);
    if (!user) throw ApiError.notFound('User not found');
    res.status(200).json({ success: true, data: { user } });
  })
);

router.patch(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    // Whitelist updatable fields — never trust the body wholesale (no role/email/password here).
    const allowed = ['name', 'phone', 'dateOfBirth', 'address', 'emergencyContact'] as const;
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }
    const user = await User.findByIdAndUpdate(req.user!.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!user) throw ApiError.notFound('User not found');
    res.status(200).json({ success: true, message: 'Profile updated', data: { user } });
  })
);

// Admin-only: list users with pagination — demonstrates RBAC end-to-end.
router.get(
  '/',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(String(req.query.page || '1'), 10), 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20'), 10), 1), 100);
    const roleFilter = req.query.role;

    const filter: Record<string, unknown> = {};
    if (roleFilter && ['customer', 'owner', 'admin'].includes(String(roleFilter))) {
      filter.role = roleFilter;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  })
);

// Owner-only example endpoint — demonstrates a second role gate.
router.get(
  '/owner/verification-status',
  authenticate,
  authorize('owner'),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!.id).select('ownerVerification');
    res.status(200).json({ success: true, data: { ownerVerification: user?.ownerVerification } });
  })
);

// Admin-only: ban / unban a user account, with an audit trail.
router.post(
  '/:id/ban',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const target = await User.findById(req.params.id);
    if (!target) throw ApiError.notFound('User not found');
    if (target.role === 'admin') throw ApiError.badRequest('Cannot ban another admin account');

    target.isBanned = true;
    target.banReason = req.body.reason || 'Violation of platform policy';
    target.refreshTokenHash = undefined; // force logout everywhere
    await target.save();

    await AuditLog.create({
      actor: req.user!.id,
      action: 'user_banned',
      targetType: 'User',
      targetId: target._id,
      metadata: { reason: target.banReason },
    });

    res.status(200).json({ success: true, message: 'User banned', data: { user: target } });
  })
);

router.post(
  '/:id/unban',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const target = await User.findById(req.params.id);
    if (!target) throw ApiError.notFound('User not found');

    target.isBanned = false;
    target.banReason = undefined;
    await target.save();

    await AuditLog.create({
      actor: req.user!.id,
      action: 'user_unbanned',
      targetType: 'User',
      targetId: target._id,
    });

    await createNotification({
      userId: target.id,
      type: 'admin_broadcast',
      title: 'Account reinstated',
      message: 'Your DriveHub account has been reinstated by an administrator.',
    });

    res.status(200).json({ success: true, message: 'User unbanned', data: { user: target } });
  })
);

export default router;
