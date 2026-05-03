namespace backend.Entities
{
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int LikeCount { get; set; } = 0;
        public int DislikeCount { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Category
        public int CategoryId { get; set; }
        public Category Category { get; set; } = null!;

        // Image
        public string? ImagePath { get; set; }

        // Navigation
        public List<Review> Reviews { get; set; } = new();
        public List<ProductLike> Likes { get; set; } = new();
        public List<ProductDislike> Dislikes { get; set; } = new();
    }
}
