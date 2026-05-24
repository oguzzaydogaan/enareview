using backend.Entities;
using Microsoft.EntityFrameworkCore;

namespace backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<ProductLike> ProductLikes { get; set; }
        public DbSet<ProductDislike> ProductDislikes { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<ProductSummary> ProductSummaries { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Username).IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.Username).IsUnique();
                entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            });

            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.HasIndex(e => e.Name).IsUnique();
            });

            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(150);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.ImagePath).HasMaxLength(500);

                entity.HasOne(e => e.Category)
                      .WithMany(c => c.Products)
                      .HasForeignKey(e => e.CategoryId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Review>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Content).IsRequired().HasMaxLength(1000);

                entity.HasOne(r => r.Product)
                      .WithMany(p => p.Reviews)
                      .HasForeignKey(r => r.ProductId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(r => r.User)
                      .WithMany(u => u.Reviews)
                      .HasForeignKey(r => r.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ProductLike>(entity =>
            {
                entity.HasKey(pl => new { pl.ProductId, pl.UserId });

                entity.HasOne(pl => pl.Product)
                      .WithMany(p => p.Likes)
                      .HasForeignKey(pl => pl.ProductId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(pl => pl.User)
                      .WithMany(u => u.ProductLikes)
                      .HasForeignKey(pl => pl.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ProductSummary>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.ProductId).IsUnique();
                entity.Property(e => e.Summary).IsRequired().HasMaxLength(2000);

                entity.HasOne(e => e.Product)
                      .WithOne()
                      .HasForeignKey<ProductSummary>(e => e.ProductId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ProductDislike>(entity =>
            {
                entity.HasKey(pd => new { pd.ProductId, pd.UserId });

                entity.HasOne(pd => pd.Product)
                      .WithMany(p => p.Dislikes)
                      .HasForeignKey(pd => pd.ProductId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(pd => pd.User)
                      .WithMany(u => u.ProductDislikes)
                      .HasForeignKey(pd => pd.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
