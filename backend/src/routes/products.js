import { Router } from 'express';
import { productStore, reviewStore } from '../db/store.js';

export const productRouter = Router();

// GET /api/products
productRouter.get('/', (req, res) => {
  const { q, category, minPrice, maxPrice, sort } = req.query;
  let results = productStore.search({
    query: q,
    category,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    inStock: false,
  });

  // Sort
  if (sort === 'price_asc') results.sort((a, b) => a.price - b.price);
  else if (sort === 'price_desc') results.sort((a, b) => b.price - a.price);
  else if (sort === 'best_selling') results.sort((a, b) => (b.sold || 0) - (a.sold || 0));
  else if (sort === 'newest') results.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  else if (sort === 'rating_desc') results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  else results.sort((a, b) => (b.sold || 0) - (a.sold || 0)); // default: ban chay

  res.json(results.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    category: p.category,
    price: p.price,
    originalPrice: p.originalPrice,
    image: p.image,
    stock: p.stock,
    sold: p.sold,
    tags: p.tags,
    rating: p.rating,
    reviews: p.reviews,
  })));
});

// GET /api/products/categories
productRouter.get('/categories', (_req, res) => {
  res.json(productStore.categories());
});

// GET /api/products/:id
productRouter.get('/:id', (req, res) => {
  const p = productStore.getById(req.params.id);
  if (!p) return res.status(404).json({ error: 'Không tìm thấy sản phẩm.' });
  res.json(p);
});

// GET /api/products/:id/reviews
productRouter.get('/:id/reviews', (req, res) => {
  const reviews = reviewStore.byProduct(req.params.id);
  res.json(reviews);
});
