using backend.DTOs;

namespace backend.Services
{
    public interface IProductService
    {
        Task<IEnumerable<ProductDto>> GetProductsAsync(int page = 1, int pageSize = 10);
        Task<ProductDto?> GetProductByIdAsync(int id);
        Task<ProductDto> CreateProductAsync(CreateProductDto request);
        Task<(bool Success, string Message, int LikeCount, int DislikeCount)> ToggleLikeAsync(int productId, int userId);
        Task<(bool Success, string Message, int LikeCount, int DislikeCount)> ToggleDislikeAsync(int productId, int userId);
    }
}
