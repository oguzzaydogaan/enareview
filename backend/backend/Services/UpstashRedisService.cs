using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace backend.Services
{
    public class UpstashRedisService : IRedisService
    {
        private readonly HttpClient _http;
        private readonly string _baseUrl;

        public UpstashRedisService()
        {
            _baseUrl = (Environment.GetEnvironmentVariable("UPSTASH_REDIS_REST_URL")
                ?? throw new InvalidOperationException("UPSTASH_REDIS_REST_URL environment variable is not set.")).TrimEnd('/');

            var token = Environment.GetEnvironmentVariable("UPSTASH_REDIS_REST_TOKEN")
                ?? throw new InvalidOperationException("UPSTASH_REDIS_REST_TOKEN environment variable is not set.");

            _http = new HttpClient();
            _http.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);
        }

        private async Task<JsonElement> ExecuteAsync(params object[] command)
        {
            var body = JsonSerializer.Serialize(command);
            var response = await _http.PostAsync(
                _baseUrl,
                new StringContent(body, Encoding.UTF8, "application/json"));

            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            return doc.RootElement.GetProperty("result").Clone();
        }

        private async Task<JsonDocument> ExecutePipelineAsync(object[][] commands)
        {
            var body = JsonSerializer.Serialize(commands);
            var response = await _http.PostAsync(
                $"{_baseUrl}/pipeline",
                new StringContent(body, Encoding.UTF8, "application/json"));

            response.EnsureSuccessStatusCode();
            return JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        }

        public async Task<long> IncrAsync(string key)
        {
            var result = await ExecuteAsync("INCR", key);
            return result.GetInt64();
        }

        public async Task<long> DecrAsync(string key)
        {
            var result = await ExecuteAsync("DECR", key);
            return result.GetInt64();
        }

        public async Task<long?> GetCountAsync(string key)
        {
            var result = await ExecuteAsync("GET", key);
            if (result.ValueKind == JsonValueKind.Null) return null;
            return long.Parse(result.GetString()!);
        }

        public async Task SetIfNotExistsAsync(string key, long value)
        {
            await ExecuteAsync("SET", key, value.ToString(), "NX");
        }

        public async Task SAddAsync(string key, string member)
        {
            await ExecuteAsync("SADD", key, member);
        }

        public async Task SRemAsync(string key, string member)
        {
            await ExecuteAsync("SREM", key, member);
        }

        public async Task<List<string>> SMembersAsync(string key)
        {
            var result = await ExecuteAsync("SMEMBERS", key);
            if (result.ValueKind == JsonValueKind.Null) return [];
            return result.EnumerateArray().Select(e => e.GetString()!).ToList();
        }

        public async Task MarkProductDirtyAsync(int productId)
        {
            await SAddAsync("sync:dirtyProducts", productId.ToString());
        }

        public async Task<List<int>> PopDirtyProductsAsync()
        {
            using var doc = await ExecutePipelineAsync([
                ["SMEMBERS", "sync:dirtyProducts"],
                ["DEL", "sync:dirtyProducts"]
            ]);

            var membersResult = doc.RootElement[0].GetProperty("result");
            if (membersResult.ValueKind == JsonValueKind.Null) return [];

            return membersResult
                .EnumerateArray()
                .Select(e => int.Parse(e.GetString()!))
                .ToList();
        }
    }
}
