using backend.DTOs;
using backend.Entities;

namespace backend.Services
{
    public interface IUserService
    {
        Task<User> SignupAsync(SignupDto dto);
        Task<User> LoginAsync(LoginDto dto);
        Task<User?> GetUserByIdAsync(int id);
    }
}
