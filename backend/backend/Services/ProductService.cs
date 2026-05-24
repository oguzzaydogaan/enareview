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
        private readonly IRedisService _redisService;

        public ProductService(AppDbContext context, IWebHostEnvironment env, IRedisService redisService)
        {
            _context = context;
            _env = env;
            _redisService = redisService;
        }

        private async Task EnsureRedisCountsInitializedAsync(int productId, int likeCount, int dislikeCount)
        {
            await _redisService.SetIfNotExistsAsync($"product:{productId}:likeCount", likeCount);
            await _redisService.SetIfNotExistsAsync($"product:{productId}:dislikeCount", dislikeCount);
        }

        public async Task<IEnumerable<ProductDto>> GetProductsAsync(int page = 1, int pageSize = 10, string? baseUrl = null, string? search = null, string? sortBy = null, int? categoryId = null)
        {
            var query = _context.Products
                .Include(p => p.Category)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(p => p.Name.ToLower().Contains(search.ToLower()));

            if (categoryId.HasValue)
                query = query.Where(p => p.CategoryId == categoryId.Value);

            query = sortBy switch
            {
                "mostReviewed" => query.OrderByDescending(p => p.Reviews.Count),
                "mostLiked"    => query.OrderByDescending(p => p.LikeCount),
                _              => query.OrderByDescending(p => p.CreatedAt)
            };

            return await query
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
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Reviews)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null) return null;

            var summary = await _context.ProductSummaries
                .FirstOrDefaultAsync(s => s.ProductId == id);

            return new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                LikeCount = product.LikeCount,
                DislikeCount = product.DislikeCount,
                CreatedAt = product.CreatedAt,
                CategoryId = product.CategoryId,
                CategoryName = product.Category.Name,
                ImageUrl = product.ImagePath != null && baseUrl != null
                    ? $"{baseUrl}/{product.ImagePath}"
                    : null,
                AverageRating = product.Reviews.Any() ? Math.Round(product.Reviews.Average(r => r.Rating), 1) : 0,
                ReviewCount = product.Reviews.Count,
                AiSummary = summary?.Summary
            };
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

            await EnsureRedisCountsInitializedAsync(productId, product.LikeCount, product.DislikeCount);

            var likeKey = $"product:{productId}:likeCount";
            var dislikeKey = $"product:{productId}:dislikeCount";

            var existingLike = await _context.ProductLikes.FirstOrDefaultAsync(pl => pl.ProductId == productId && pl.UserId == userId);
            var existingDislike = await _context.ProductDislikes.FirstOrDefaultAsync(pd => pd.ProductId == productId && pd.UserId == userId);

            if (existingDislike != null)
            {
                _context.ProductDislikes.Remove(existingDislike);
                await _redisService.DecrAsync(dislikeKey);
            }

            string message;
            if (existingLike != null)
            {
                _context.ProductLikes.Remove(existingLike);
                await _redisService.DecrAsync(likeKey);
                message = "Like removed";
            }
            else
            {
                _context.ProductLikes.Add(new ProductLike { ProductId = productId, UserId = userId });
                await _redisService.IncrAsync(likeKey);
                message = "Like added";
            }

            await _context.SaveChangesAsync();
            await _redisService.MarkProductDirtyAsync(productId);

            var newLikeCount = (int)(await _redisService.GetCountAsync(likeKey) ?? product.LikeCount);
            var newDislikeCount = (int)(await _redisService.GetCountAsync(dislikeKey) ?? product.DislikeCount);

            return (true, message, newLikeCount, newDislikeCount);
        }

        public async Task<(bool Success, string Message, int LikeCount, int DislikeCount)> ToggleDislikeAsync(int productId, int userId)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null) return (false, "Product not found", 0, 0);

            await EnsureRedisCountsInitializedAsync(productId, product.LikeCount, product.DislikeCount);

            var likeKey = $"product:{productId}:likeCount";
            var dislikeKey = $"product:{productId}:dislikeCount";

            var existingDislike = await _context.ProductDislikes.FirstOrDefaultAsync(pd => pd.ProductId == productId && pd.UserId == userId);
            var existingLike = await _context.ProductLikes.FirstOrDefaultAsync(pl => pl.ProductId == productId && pl.UserId == userId);

            if (existingLike != null)
            {
                _context.ProductLikes.Remove(existingLike);
                await _redisService.DecrAsync(likeKey);
            }

            string message;
            if (existingDislike != null)
            {
                _context.ProductDislikes.Remove(existingDislike);
                await _redisService.DecrAsync(dislikeKey);
                message = "Dislike removed";
            }
            else
            {
                _context.ProductDislikes.Add(new ProductDislike { ProductId = productId, UserId = userId });
                await _redisService.IncrAsync(dislikeKey);
                message = "Dislike added";
            }

            await _context.SaveChangesAsync();
            await _redisService.MarkProductDirtyAsync(productId);

            var newLikeCount = (int)(await _redisService.GetCountAsync(likeKey) ?? product.LikeCount);
            var newDislikeCount = (int)(await _redisService.GetCountAsync(dislikeKey) ?? product.DislikeCount);

            return (true, message, newLikeCount, newDislikeCount);
        }
    }
}
