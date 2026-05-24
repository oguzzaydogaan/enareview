using backend.DTOs;

namespace backend.Services
{
    public interface IReviewService
    {
        Task<(bool Success, string Message, IEnumerable<ReviewDto>? Reviews)> GetReviewsAsync(int productId);
        Task<(bool Success, string Message, ReviewDto? Review)> CreateReviewAsync(int productId, int userId, CreateReviewDto request);
        Task<(bool Success, string Message)> DeleteReviewAsync(int productId, int reviewId, int userId);
        Task<SummaryDto?> GetSummaryAsync(int productId);
    }
}
