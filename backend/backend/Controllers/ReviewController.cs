using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/products/{productId}/reviews")]
    public class ReviewController : ControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        [HttpGet]
        public async Task<IActionResult> GetReviews(int productId)
        {
            try
            {
                var result = await _reviewService.GetReviewsAsync(productId);
                if (!result.Success) return NotFound(new { message = result.Message });

                return Ok(result.Reviews);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateReview(int productId, [FromBody] CreateReviewDto request)
        {
            try
            {
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

                var result = await _reviewService.CreateReviewAsync(productId, userId, request);
                if (!result.Success)
                {
                    if (result.Message == "Product not found") return NotFound(new { message = result.Message });
                    return BadRequest(new { message = result.Message });
                }

                return Created(string.Empty, result.Review);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReview(int productId, int id)
        {
            try
            {
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

                var result = await _reviewService.DeleteReviewAsync(productId, id, userId);
                
                if (!result.Success)
                {
                    if (result.Message == "Forbidden") return Forbid();
                    return NotFound(new { message = result.Message });
                }

                return Ok(new { message = "Review deleted" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
