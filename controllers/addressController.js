import asyncHandler from "express-async-handler";
import Address from "../models/addressModel.js";

// @desc    Create new address
// @route   POST /api/address
// @access  Private
const createAddress = asyncHandler(async (req, res) => {
  const { address, city, postalCode, country, extraCharge } = req.body;
  
  // Check if user already has addresses
  const existingAddresses = await Address.find({ user: req.user._id });
  
  // Create new address
  const newAddress = new Address({
    user: req.user._id,
    address,
    city,
    postalCode,
    country,
    extraCharge,
    // Set as default if it's the first address
    isDefault: existingAddresses.length === 0
  });

  const savedAddress = await newAddress.save();

  res.status(201).json(savedAddress);
});

// @desc    Get user addresses
// @route   GET /api/address
// @access  Private
const getUserAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id });
  
  res.status(200).json(addresses);
});

// @desc    Update address
// @route   PUT /api/address/:id
// @access  Private
const updateAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const address = await Address.findOneAndUpdate(
    { _id: id, user: req.user._id },
    { ...req.body },
    { new: true }
  );

  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }

  res.status(200).json(address);
});

// @desc    Delete address
// @route   DELETE /api/address/:id
// @access  Private
const deleteAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const address = await Address.findOneAndDelete({ 
    _id: id, 
    user: req.user._id 
  });

  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }

  // If deleted address was default, set a new default if addresses exist
  const remainingAddresses = await Address.find({ user: req.user._id });
  if (remainingAddresses.length > 0 && !remainingAddresses.some(addr => addr.isDefault)) {
    await Address.findOneAndUpdate(
      { _id: remainingAddresses[0]._id },
      { isDefault: true }
    );
  }

  res.status(200).json({ message: 'Address removed' });
});

// @desc    Set default address
// @route   PUT /api/address/:id/default
// @access  Private
const setDefaultAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // First, remove default from all other addresses
  await Address.updateMany(
    { user: req.user._id },
    { isDefault: false }
  );

  // Then set the specified address as default
  const address = await Address.findOneAndUpdate(
    { _id: id, user: req.user._id },
    { isDefault: true },
    { new: true }
  );

  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }

  res.status(200).json(address);
});

export {
  createAddress,
  getUserAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress
};