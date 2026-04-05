namespace backend.Entities
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public bool IsPhoneVerified { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public List<Review> Reviews { get; set; } = new();
        public List<ProductLike> ProductLikes { get; set; } = new();
        public List<ProductDislike> ProductDislikes { get; set; } = new();
    }
}
