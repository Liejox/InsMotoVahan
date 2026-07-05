import { Router } from 'express';
import { authController } from '../controllers/authController';
import { validateRequest } from '../middlewares/validate';
import { loginSchema, registerSchema } from '../utils/validationSchemas';
import { authenticate } from '../middlewares/auth';
import { loginLimiter, registerLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.post('/login', loginLimiter, validateRequest(loginSchema), authController.login);
router.post('/register', registerLimiter, validateRequest(registerSchema), authController.register);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate as any, authController.logout);
router.get('/me', authenticate as any, authController.me);

export default router;
