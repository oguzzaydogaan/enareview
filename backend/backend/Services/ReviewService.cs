using backend.Data;
using backend.DTOs;
using backend.Entities;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class ReviewService : IReviewService
    {
        private readonly AppDbContext _context;
        private readonly IMessageProducer _messageProducer;

        public ReviewService(AppDbContext context, IMessageProducer messageProducer)
        {
            _context = context;
            _messageProducer = messageProducer;
        }

        public async Task<(bool Success, string Message, IEnumerable<ReviewDto>? Reviews)> GetReviewsAsync(int productId)
        {
            var productExists = await _context.Products.AnyAsync(p => p.Id == productId);
            if (!productExists) return (false, "Product not found", null);

            var reviews = await _context.Reviews
                .Include(r => r.User)
                .Where(r => r.ProductId == productId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new ReviewDto
                {
                    Id = r.Id,
                    ProductId = r.ProductId,
                    UserId = r.UserId,
                    Username = r.User != null ? r.User.Username : "Unknown",
                    Content = r.Content,
                    Rating = r.Rating,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            return (true, "Success", reviews);
        }

        public async Task<(bool Success, string Message, ReviewDto? Review)> CreateReviewAsync(int productId, int userId, CreateReviewDto request)
        {
            var productExists = await _context.Products.AnyAsync(p => p.Id == productId);
            if (!productExists) return (false, "Product not found", null);

            var alreadyReviewed = await _context.Reviews.AnyAsync(r => r.ProductId == productId && r.UserId == userId);
            if (alreadyReviewed) return (false, "You have already reviewed this product", null);

            var reviewMessage = new ReviewMessageParams
            {
                ProductId = productId,
                UserId = userId,
                Content = request.Content,
                Rating = request.Rating
            };

            await _messageProducer.PublishMessageAsync(reviewMessage, "review_queue");

            return (true, "Review submitted for processing", null);
        }

        public async Task<(bool Success, string Message)> DeleteReviewAsync(int productId, int reviewId, int userId)
        {
            var review = await _context.Reviews.FirstOrDefaultAsync(r => r.Id == reviewId && r.ProductId == productId);
            if (review == null) return (false, "Review not found");

            if (review.UserId != userId) return (false, "Forbidden");

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();

            return (true, "Review deleted");
        }
    }
}
