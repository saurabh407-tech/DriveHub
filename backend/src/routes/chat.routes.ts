import { Router } from 'express';
import * as chatController from '../controllers/chat.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { startConversationValidator, sendMessageValidator } from '../validators/chat.validator';

const router = Router();

router.use(authenticate);

router.get('/conversations', chatController.listConversations);
router.post('/conversations', startConversationValidator, validate, chatController.getOrCreateConversation);
router.get('/conversations/:id/messages', chatController.listMessages);
router.post('/conversations/:id/messages', sendMessageValidator, validate, chatController.sendMessage);
router.post('/conversations/:id/read', chatController.markRead);

export default router;
