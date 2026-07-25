const Product = require('../models/productModel');

// Helper to check if request is from an admin
const isAdmin = (req) => {
  return req.headers['x-user-role'] === 'admin';
};

// GET /products - List products (support filtering by category and text search)
exports.getProducts = async (req, res) => {
  try {
    const { category, q } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }

    if (q) {
      query.$text = { $search: q };
    }

    const products = await Product.find(query);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve products', error: error.message });
  }
};

// GET /products/:id - Single product details
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve product', error: error.message });
  }
};

// POST /products - Create product (Admin only)
exports.createProduct = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    const { name, description, price, category, stock } = req.body;
    if (!name || price === undefined || !category) {
      return res.status(400).json({ message: 'Name, price, and category are required' });
    }

    const product = new Product({ name, description, price, category, stock });
    await product.save();

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
};

// PUT /products/:id - Update product (Admin only)
exports.updateProduct = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    const { id } = req.params;
    const { name, description, price, category, stock } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (category !== undefined) product.category = category;
    if (stock !== undefined) product.stock = stock;

    await product.save();
    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
};

// DELETE /products/:id - Delete product (Admin only)
exports.deleteProduct = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
};
