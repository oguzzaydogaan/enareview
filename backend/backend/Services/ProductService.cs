using backend.Data;
using backend.DTOs;
using backend.Entities;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class ProductService : IProductService
    {
        private readonly AppDbContext _context;

        public ProductService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ProductDto>> GetProductsAsync(int page = 1, int pageSize = 10)
        {
            return await _context.Products
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    LikeCount = p.LikeCount,
                    DislikeCount = p.DislikeCount,
                    CreatedAt = p.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<ProductDto?> GetProductByIdAsync(int id)
        {
            return await _context.Products
                .Select(p => new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    LikeCount = p.LikeCount,
                    DislikeCount = p.DislikeCount,
                    CreatedAt = p.CreatedAt
                })
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<ProductDto> CreateProductAsync(CreateProductDto request)
        {
            var product = new Product
            {
                Name = request.Name,
                Description = request.Description
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
                CreatedAt = product.CreatedAt
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
