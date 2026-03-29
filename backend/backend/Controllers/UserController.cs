using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/users")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IConfiguration _configuration;

        public UserController(IUserService userService, IConfiguration configuration)
        {
            _userService = userService;
            _configuration = configuration;
        }

        [HttpPost("signup")]
        public async Task<IActionResult> Signup([FromBody] SignupDto request)
        {
            try
            {
                var user = await _userService.SignupAsync(request);
                return Ok(new { message = "User registered successfully", userId = user.Id });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto request)
        {
            try
            {
                var user = await _userService.LoginAsync(request);

                var tokenHandler = new JwtSecurityTokenHandler();
                var jwtSettings = _configuration.GetSection("Jwt");
                var key = Encoding.ASCII.GetBytes(jwtSettings["Key"] ?? "ThisIsAVerySecretKeyThatIsAtLeast32BytesLong!");
                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                        new Claim(ClaimTypes.Name, user.Username),
                        new Claim(ClaimTypes.Email, user.Email)
                    }),
                    Expires = DateTime.UtcNow.AddDays(7),
                    Issuer = jwtSettings["Issuer"],
                    Audience = jwtSettings["Audience"],
                    SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
                };

                var token = tokenHandler.CreateToken(tokenDescriptor);
                var tokenString = tokenHandler.WriteToken(token);

                return Ok(new { message = "Login successful", userId = user.Id, username = user.Username, token = tokenString });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize]
        [HttpGet("refresh")]
        public async Task<IActionResult> RefreshToken()
        {
            try
            {
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
                {
                    return Unauthorized(new { message = "Invalid token claims." });
                }

                var user = await _userService.GetUserByIdAsync(userId);
                if (user == null)
                {
                    return Unauthorized(new { message = "User not found." });
                }

                // Generate new JWT
                var tokenHandler = new JwtSecurityTokenHandler();
                var jwtSettings = _configuration.GetSection("Jwt");
                var key = Encoding.ASCII.GetBytes(jwtSettings["Key"] ?? "ThisIsAVerySecretKeyThatIsAtLeast32BytesLong!");
                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                        new Claim(ClaimTypes.Name, user.Username),
                        new Claim(ClaimTypes.Email, user.Email)
                    }),
                    Expires = DateTime.UtcNow.AddDays(7),
                    Issuer = jwtSettings["Issuer"],
                    Audience = jwtSettings["Audience"],
                    SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
                };

                var token = tokenHandler.CreateToken(tokenDescriptor);
                var tokenString = tokenHandler.WriteToken(token);

                return Ok(new { message = "Token refreshed", userId = user.Id, username = user.Username, token = tokenString });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

    }
}
