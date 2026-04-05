namespace backend.DTOs
{
    public class ProductDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int LikeCount { get; set; }
        public int DislikeCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
