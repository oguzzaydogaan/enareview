namespace backend.Services
{
    public interface IRedisService
    {
        Task<long> IncrAsync(string key);
        Task<long> DecrAsync(string key);
        Task<long?> GetCountAsync(string key);
        Task SetIfNotExistsAsync(string key, long value);
        Task SAddAsync(string key, string member);
        Task SRemAsync(string key, string member);
        Task<List<string>> SMembersAsync(string key);
        Task MarkProductDirtyAsync(int productId);
        Task<List<int>> PopDirtyProductsAsync();
    }
}
