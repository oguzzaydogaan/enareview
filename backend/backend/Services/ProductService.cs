using backend.Data;
using backend.DTOs;
using backend.Entities;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class ProductService : IProductService
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public ProductService(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        public async Task<IEnumerable<ProductDto>> GetProductsAsync(int page = 1, int pageSize = 10, string? baseUrl = null)
        {
            return await _context.Products
                .Include(p => p.Category)
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    LikeCount = p.LikeCount,
                    DislikeCount = p.DislikeCount,
                    CreatedAt = p.CreatedAt,
                    CategoryId = p.CategoryId,
                    CategoryName = p.Category.Name,
                    ImageUrl = p.ImagePath != null && baseUrl != null
                        ? $"{baseUrl}/{p.ImagePath}"
                        : null,
                    AverageRating = p.Reviews.Any() ? Math.Round(p.Reviews.Average(r => r.Rating), 1) : 0,
                    ReviewCount = p.Reviews.Count
                })
                .ToListAsync();
        }

        public async Task<ProductDto?> GetProductByIdAsync(int id, string? baseUrl = null)
        {
            return await _context.Products
                .Include(p => p.Category)
                .Where(p => p.Id == id)
                .Select(p => new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    LikeCount = p.LikeCount,
                    DislikeCount = p.DislikeCount,
                    CreatedAt = p.CreatedAt,
                    CategoryId = p.CategoryId,
                    CategoryName = p.Category.Name,
                    ImageUrl = p.ImagePath != null && baseUrl != null
                        ? $"{baseUrl}/{p.ImagePath}"
                        : null,
                    AverageRating = p.Reviews.Any() ? Math.Round(p.Reviews.Average(r => r.Rating), 1) : 0,
                    ReviewCount = p.Reviews.Count
                })
                .FirstOrDefaultAsync();
        }

        public async Task<ProductDto> CreateProductAsync(CreateProductDto request, string baseUrl)
        {
            var category = await _context.Categories.FindAsync(request.CategoryId);
            if (category == null)
                throw new ArgumentException("Category not found.");

            string? imagePath = null;

            if (request.Image != null && request.Image.Length > 0)
            {
                var uploadsDir = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "products");
                Directory.CreateDirectory(uploadsDir);

                var ext = Path.GetExtension(request.Image.FileName).ToLowerInvariant();
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                if (!allowedExtensions.Contains(ext))
                    throw new ArgumentException("Invalid image format. Allowed: jpg, jpeg, png, gif, webp");

                var fileName = $"{Guid.NewGuid()}{ext}";
                var filePath = Path.Combine(uploadsDir, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await request.Image.CopyToAsync(stream);
                }

                imagePath = $"uploads/products/{fileName}";
            }

            var product = new Product
            {
                Name = request.Name,
                Description = request.Description,
                CategoryId = request.CategoryId,
                ImagePath = imagePath
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                LikeCount = product.LikeCount,
                DislikeCount = product.DislikeCount,
                CreatedAt = product.CreatedAt,
                CategoryId = product.CategoryId,
                CategoryName = category.Name,
                ImageUrl = imagePath != null ? $"{baseUrl}/{imagePath}" : null,
                AverageRating = 0,
                ReviewCount = 0
            };
        }

        public async Task<(bool Success, string Message, int LikeCount, int DislikeCount)> ToggleLikeAsync(int productId, int userId)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null) return (false, "Product not found", 0, 0);

            var existingLike = await _context.ProductLikes.FirstOrDefaultAsync(pl => pl.ProductId == productId && pl.UserId == userId);
            var existingDislike = await _context.ProductDislikes.FirstOrDefaultAsync(pd => pd.ProductId == productId && pd.UserId == userId);
            
            if (existingDislike != null)
            {
                _context.ProductDislikes.Remove(existingDislike);
                product.DislikeCount = Math.Max(0, product.DislikeCount - 1);
            }

            if (existingLike != null)
            {
                _context.ProductLikes.Remove(existingLike);
                product.LikeCount = Math.Max(0, product.LikeCount - 1);
                await _context.SaveChangesAsync();
                return (true, "Like removed", product.LikeCount, product.DislikeCount);
            }
            else
            {
                _context.ProductLikes.Add(new ProductLike { ProductId = productId, UserId = userId });
                product.LikeCount++;
                await _context.SaveChangesAsync();
                return (true, "Like added", product.LikeCount, product.DislikeCount);
            }
        }

        public async Task<(bool Success, string Message, int LikeCount, int DislikeCount)> ToggleDislikeAsync(int productId, int userId)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null) return (false, "Product not found", 0, 0);

            var existingDislike = await _context.ProductDislikes.FirstOrDefaultAsync(pd => pd.ProductId == productId && pd.UserId == userId);
            var existingLike = await _context.ProductLikes.FirstOrDefaultAsync(pl => pl.ProductId == productId && pl.UserId == userId);
            
            if (existingLike != null)
            {
                _context.ProductLikes.Remove(existingLike);
                product.LikeCount = Math.Max(0, product.LikeCount - 1);
            }

            if (existingDislike != null)
            {
                _context.ProductDislikes.Remove(existingDislike);
                product.DislikeCount = Math.Max(0, product.DislikeCount - 1);
                await _context.SaveChangesAsync();
                return (true, "Dislike removed", product.LikeCount, product.DislikeCount);
            }
            else
            {
                _context.ProductDislikes.Add(new ProductDislike { ProductId = productId, UserId = userId });
                product.DislikeCount++;
                await _context.SaveChangesAsync();
                return (true, "Dislike added", product.LikeCount, product.DislikeCount);
            }
        }
    }
}
