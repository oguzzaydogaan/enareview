namespace backend.DTOs
{
    public class ReviewMessageParams
    {
        public int ProductId { get; set; }
        public int UserId { get; set; }
        public required string Content { get; set; }
        public int Rating { get; set; }
    }
}
