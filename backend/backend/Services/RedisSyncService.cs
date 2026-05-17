using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class RedisSyncService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IRedisService _redisService;
        private readonly TimeSpan _syncInterval = TimeSpan.FromSeconds(10);

        public RedisSyncService(IServiceScopeFactory scopeFactory, IRedisService redisService)
        {
            _scopeFactory = scopeFactory;
            _redisService = redisService;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                await Task.Delay(_syncInterval, stoppingToken);

                try
                {
                    await SyncDirtyProductsAsync();
                }
                catch { }
            }
        }

        private async Task SyncDirtyProductsAsync()
        {
            var dirtyProductIds = await _redisService.PopDirtyProductsAsync();
            if (dirtyProductIds.Count == 0) return;

            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            foreach (var productId in dirtyProductIds)
            {
                var likeCount = await _redisService.GetCountAsync($"product:{productId}:likeCount");
                var dislikeCount = await _redisService.GetCountAsync($"product:{productId}:dislikeCount");

                if (likeCount == null && dislikeCount == null) continue;

                var product = await context.Products.FindAsync(productId);
                if (product == null) continue;

                if (likeCount.HasValue) product.LikeCount = (int)likeCount.Value;
                if (dislikeCount.HasValue) product.DislikeCount = (int)dislikeCount.Value;
            }

            await context.SaveChangesAsync();
        }
    }
}
