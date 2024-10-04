import asyncHandler from "express-async-handler";
import Address from "../models/addressModel.js";

// @desc    Save user address
// @route   POST /api/address
// @access  Private
const saveAddress = asyncHandler(async (req, res) => {
  const { address, city, postalCode, country, extraCharge } = req.body;

  const newAddress = new Address({
    user: req.user._id,
    address,
    city,
    postalCode,
    country,
    extraCharge,
  });

  const savedAddress = await newAddress.save();

  res.status(201).json(savedAddress);
});

// @desc    Get user address
// @route   GET /api/address
// @access  Private
const getUserAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });

  if (address) {
    res.json(address);
  } else {
    res.status(404);
    throw new Error("Address not found");
  }
});

// @desc    Update user address
// @route   PUT /api/address/:id
// @access  Private
const updateAddress = asyncHandler(async (req, res) => {
  const { address, city, postalCode, country, extraCharge } = req.body;

  const addressToUpdate = await Address.findOne({ _id: req.params.id, user: req.user._id });

  if (addressToUpdate) {
    addressToUpdate.address = address || addressToUpdate.address;
    addressToUpdate.city = city || addressToUpdate.city;
    addressToUpdate.postalCode = postalCode || addressToUpdate.postalCode;
    addressToUpdate.country = country || addressToUpdate.country;
    addressToUpdate.extraCharge = extraCharge || addressToUpdate.extraCharge;

    const updatedAddress = await addressToUpdate.save();
    res.json(updatedAddress);
  } else {
    res.status(404);
    throw new Error("Address not found");
  }
});

// @desc    Delete user address
// @route   DELETE /api/address/:id
// @access  Private
const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });

  if (address) {
    await address.remove();
    res.json({ message: "Address removed" });
  } else {
    res.status(404);
    throw new Error("Address not found");
  }
});
// @desc    Test post address
// @route   POST /api/address/test
// @access  Public
const testAddressPost = asyncHandler(async (req, res) => {
    const { address, city, postalCode, country, extraCharge } = req.body;
  
    const newAddress = new Address({
      user: "000000000000000000000000", // Dummy user ID for testing
      address,
      city,
      postalCode,
      country,
      extraCharge,
    });
  
    const savedAddress = await newAddress.save();
  
    res.status(201).json(savedAddress);
  });
  
  // @desc    Test get addresses
  // @route   GET /api/address/test
  // @access  Public
  const testAddressGet = asyncHandler(async (req, res) => {
    const addresses = await Address.find({ user: "000000000000000000000000" });
  
    res.json(addresses);
  });
  
  export { 
    saveAddress, 
    getUserAddress, 
    updateAddress, 
    deleteAddress, 
    testAddressPost, 
    testAddressGet 
  };

