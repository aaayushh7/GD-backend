import Category from "../models/categoryModel.js";
import Subcategory from "../models/subcategoryModel.js"; // Add this line
import asyncHandler from "../middlewares/asyncHandler.js";
import {load} from '@cashfreepayments/cashfree-js';

const cashfree = await load({
	mode: "sandbox" 
});

const createCategory = asyncHandler(async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.json({ error: "Name is required" });
    }

    const existingCategory = await Category.findOne({ name });

    if (existingCategory) {
      return res.json({ error: "Already exists" });
    }

    const category = await new Category({ name }).save();
    res.json(category);
  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }
});

const updateCategory = asyncHandler(async (req, res) => {
  try {
    const { name } = req.body;
    const { categoryId } = req.params;

    const category = await Category.findOne({ _id: categoryId });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    category.name = name;

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const removeCategory = asyncHandler(async (req, res) => {
  try {
    const removed = await Category.findByIdAndRemove(req.params.categoryId);
    res.json(removed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const listCategory = asyncHandler(async (req, res) => {
  try {
    const all = await Category.find({}).populate({
      path: 'subcategories',
      options: { strictPopulate: false }
    });
    res.json(all);
  } catch (error) {
    console.log(error);
    return res.status(400).json(error.message);
  }
});

const readCategory = asyncHandler(async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id }).populate({
      path: 'subcategories',
      options: { strictPopulate: false }
    });
    res.json(category);
  } catch (error) {
    console.log(error);
    return res.status(400).json(error.message);
  }
});

// New function to create a Cashfree order for category-related payments
const createCashfreeOrderForCategory = asyncHandler(async (req, res) => {
  const { orderId, amount } = req.body; // Expect orderId and amount from request body

  if (!orderId || !amount) {
    res.status(400).json({ error: "Order ID and amount are required." });
    return;
  }

  try {
    const cashfreeOrder = await cashfree.createOrder({
      orderId,
      orderAmount: amount,
      customerName: req.user.username,
      customerEmail: req.user.email,
      customerPhone: req.user.phone, // Ensure user has phone in the model
    });

    res.json(cashfreeOrder);
  } catch (error) {
    res.status(500);
    throw new Error(error.message || "Cashfree order creation failed");
  }
});

// New functions for subcategory operations

const createSubcategory = asyncHandler(async (req, res) => {
  try {
    const { name, parentId } = req.body;

    if (!name || !parentId) {
      return res.json({ error: "Name and parent category ID are required" });
    }

    const parentCategory = await Category.findById(parentId);

    if (!parentCategory) {
      return res.status(404).json({ error: "Parent category not found" });
    }

    const existingSubcategory = await Subcategory.findOne({ name, parentCategory: parentId });

    if (existingSubcategory) {
      return res.json({ error: "Subcategory already exists" });
    }

    const subcategory = await new Subcategory({ name, parentCategory: parentId }).save();
    
    parentCategory.subcategories.push(subcategory._id);
    await parentCategory.save();

    res.json(subcategory);
  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }
});

const updateSubcategory = asyncHandler(async (req, res) => {
  try {
    const { name } = req.body;
    const { subcategoryId } = req.params;

    const subcategory = await Subcategory.findById(subcategoryId);

    if (!subcategory) {
      return res.status(404).json({ error: "Subcategory not found" });
    }

    subcategory.name = name;

    const updatedSubcategory = await subcategory.save();
    res.json(updatedSubcategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const getAllSubcategories = asyncHandler(async (req, res) => {
  try {
    const subcategories = await Subcategory.find().populate('parentCategory', 'name');
    res.json(subcategories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const getSubcategoriesByCategory = asyncHandler(async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await Category.findById(categoryId).populate('subcategories');
    
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(category.subcategories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const removeSubcategory = asyncHandler(async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.subcategoryId);
    
    if (!subcategory) {
      return res.status(404).json({ error: "Subcategory not found" });
    }

    const parentCategory = await Category.findById(subcategory.parentCategory);
    
    if (parentCategory) {
      parentCategory.subcategories = parentCategory.subcategories.filter(
        subId => subId.toString() !== subcategory._id.toString()
      );
      await parentCategory.save();
    }

    await Subcategory.findByIdAndRemove(req.params.subcategoryId);
    res.json({ message: "Subcategory removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export {
  createCategory,
  updateCategory,
  removeCategory,
  listCategory,
  readCategory,
  createCashfreeOrderForCategory,
  createSubcategory,
  updateSubcategory,
  removeSubcategory,
  getAllSubcategories,
  getSubcategoriesByCategory, // Add this new function to the exports

};
