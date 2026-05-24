namespace backend.Entities
{
    public class ProductSummary
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public Product Product { get; set; } = null!;
        public string Summary { get; set; } = string.Empty;
        public int ReviewCountAtGeneration { get; set; }
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }
}
