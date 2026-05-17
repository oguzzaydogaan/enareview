using System.Text;
using System.Text.Json;

namespace backend.Services
{
    public class GeminiService : IAiService
    {
        private const string ApiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

        private readonly string _apiKey;
        private readonly HttpClient _http;

        public GeminiService()
        {
            _apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY")
                ?? throw new InvalidOperationException("GEMINI_API_KEY environment variable is not set.");

            _http = new HttpClient { Timeout = TimeSpan.FromSeconds(15) };
        }

        public async Task<string?> SummarizeReviewsAsync(IEnumerable<string> reviews)
        {
            try
            {
                var reviewList = reviews.ToList();
                if (reviewList.Count == 0) return null;

                var numbered = string.Join("\n", reviewList.Select((r, i) => $"{i + 1}. {r}"));
                var prompt = $"Aşağıdaki ürün yorumlarını 2-3 cümleyle özetle. Yorumların dilinde yaz. Sadece özeti yaz:\n\n{numbered}";

                var body = JsonSerializer.Serialize(new
                {
                    contents = new[]
                    {
                        new { parts = new[] { new { text = prompt } } }
                    }
                });

                var response = await _http.PostAsync(
                    $"{ApiUrl}?key={_apiKey}",
                    new StringContent(body, Encoding.UTF8, "application/json"));

                response.EnsureSuccessStatusCode();

                using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());

                return doc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString()
                    ?.Trim();
            }
            catch
            {
                return null;
            }
        }
    }
}
