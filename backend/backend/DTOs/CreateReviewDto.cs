using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class CreateReviewDto
    {
        [Required]
        [MaxLength(1000)]
        public string Content { get; set; } = string.Empty;

        [Range(1, 5)]
        public int Rating { get; set; }
    }
}
