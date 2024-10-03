import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true,
    maxlength: 32,
    unique: true,
  },
  subcategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' }]
}, { timestamps: true });

export default mongoose.model('Category', categorySchema);