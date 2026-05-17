namespace backend.Services
{
    public interface IAiService
    {
        Task<string?> SummarizeReviewsAsync(IEnumerable<string> reviews);
    }
}
