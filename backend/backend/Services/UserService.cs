using backend.Data;
using backend.DTOs;
using backend.Entities;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _context;

        public UserService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<User> SignupAsync(SignupDto dto)
        {
            var decodedToken = await FirebaseAdmin.Auth.FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(dto.FirebaseToken);
            if (decodedToken == null) throw new Exception("Invalid Firebase token");

            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == dto.Email || u.Username == dto.Username);
            
            if (existingUser != null)
            {
                throw new Exception("User already exists with this email or username.");
            }

            var user = new User
            {
                Username = dto.Username,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                PhoneNumber = dto.PhoneNumber,
                IsPhoneVerified = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return user;
        }

        public async Task<User> LoginAsync(LoginDto dto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == dto.UsernameOrEmail || u.Username == dto.UsernameOrEmail);

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                throw new Exception("Invalid credentials.");
            }

            if (!user.IsPhoneVerified)
            {
                throw new Exception("Phone number is not verified. Please verify your phone number to login.");
            }

            return user;
        }

        public async Task<User?> GetUserByIdAsync(int id)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        }

    }
}
