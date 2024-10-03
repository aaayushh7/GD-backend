import express from 'express';
import {
  createSubcategory,
  updateSubcategory,
  removeSubcategory,
  getAllSubcategories,
} from '../controllers/categoryController.js';
import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/', authenticate, authorizeAdmin, createSubcategory);
router.put('/:subcategoryId', authenticate, authorizeAdmin, updateSubcategory);
router.delete('/:subcategoryId', authenticate, authorizeAdmin, removeSubcategory);
router.get('/', getAllSubcategories);

export default router;