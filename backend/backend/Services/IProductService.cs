using backend.DTOs;

namespace backend.Services
{
    public interface IProductService
    {
        Task<IEnumerable<ProductDto>> GetProductsAsync(int page = 1, int pageSize = 10, string? baseUrl = null);
        Task<ProductDto?> GetProductByIdAsync(int id, string? baseUrl = null);
        Task<ProductDto> CreateProductAsync(CreateProductDto request, string baseUrl);
        Task<(bool Success, string Message, int LikeCount, int DislikeCount)> ToggleLikeAsync(int productId, int userId);
        Task<(bool Success, string Message, int LikeCount, int DislikeCount)> ToggleDislikeAsync(int productId, int userId);
    }
}
