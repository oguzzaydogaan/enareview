using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;
using backend.Data;
using backend.Entities;
using backend.DTOs;

namespace backend.Services
{
    public class ReviewConsumerService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly IConfiguration _configuration;
        private IConnection? _connection;
        private IChannel? _channel;

        public ReviewConsumerService(IServiceProvider serviceProvider, IConfiguration configuration)
        {
            _serviceProvider = serviceProvider;
            _configuration = configuration;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var hostname = _configuration["RabbitMQ:Hostname"] ?? "localhost";
            var factory = new ConnectionFactory { HostName = hostname };

            try
            {
                _connection = await factory.CreateConnectionAsync(stoppingToken);
                _channel = await _connection.CreateChannelAsync(cancellationToken: stoppingToken);

                await _channel.QueueDeclareAsync(
                    queue: "review_queue",
                    durable: true,
                    exclusive: false,
                    autoDelete: false,
                    arguments: null,
                    cancellationToken: stoppingToken);

                var consumer = new AsyncEventingBasicConsumer(_channel);
                consumer.ReceivedAsync += async (model, ea) =>
                {
                    try
                    {
                        var body = ea.Body.ToArray();
                        var message = Encoding.UTF8.GetString(body);
                        var reviewMessage = JsonSerializer.Deserialize<ReviewMessageParams>(message);

                        if (reviewMessage != null)
                        {
                            using var scope = _serviceProvider.CreateScope();
                            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                            var alreadyReviewed = context.Reviews.Any(r => r.ProductId == reviewMessage.ProductId && r.UserId == reviewMessage.UserId);
                            if (!alreadyReviewed)
                            {
                                var review = new Review
                                {
                                    ProductId = reviewMessage.ProductId,
                                    UserId = reviewMessage.UserId,
                                    Content = reviewMessage.Content,
                                    Rating = reviewMessage.Rating
                                };

                                context.Reviews.Add(review);
                                await context.SaveChangesAsync();

                                await TryUpdateSummaryAsync(context, scope, reviewMessage.ProductId);
                            }
                        }

                        if (_channel != null)
                        {
                            await _channel.BasicAckAsync(deliveryTag: ea.DeliveryTag, multiple: false);
                        }
                    }
                    catch (Exception ex)
                    {
                        if (_channel != null)
                        {
                            await _channel.BasicNackAsync(deliveryTag: ea.DeliveryTag, multiple: false, requeue: false);
                        }
                    }
                };

                await _channel.BasicConsumeAsync(
                    queue: "review_queue",
                    autoAck: false,
                    consumer: consumer,
                    cancellationToken: stoppingToken);

                while (!stoppingToken.IsCancellationRequested)
                {
                    await Task.Delay(1000, stoppingToken);
                }
            }
            catch (OperationCanceledException) { }
            catch (Exception ex) { }
        }

        private async Task TryUpdateSummaryAsync(AppDbContext context, IServiceScope scope, int productId)
        {
            try
            {
                var totalReviews = context.Reviews.Count(r => r.ProductId == productId);
                var existingSummary = context.ProductSummaries.FirstOrDefault(s => s.ProductId == productId);

                bool shouldGenerate = existingSummary == null
                    || (totalReviews - existingSummary.ReviewCountAtGeneration) >= 5;

                if (!shouldGenerate) return;

                var aiService = scope.ServiceProvider.GetRequiredService<IAiService>();
                var reviewTexts = context.Reviews
                    .Where(r => r.ProductId == productId)
                    .Select(r => r.Content)
                    .ToList();

                var summary = await aiService.SummarizeReviewsAsync(reviewTexts);
                if (summary == null) return;

                if (existingSummary == null)
                {
                    context.ProductSummaries.Add(new Entities.ProductSummary
                    {
                        ProductId = productId,
                        Summary = summary,
                        ReviewCountAtGeneration = totalReviews,
                        GeneratedAt = DateTime.UtcNow
                    });
                }
                else
                {
                    existingSummary.Summary = summary;
                    existingSummary.ReviewCountAtGeneration = totalReviews;
                    existingSummary.GeneratedAt = DateTime.UtcNow;
                }

                await context.SaveChangesAsync();
            }
            catch { }
        }

        public override async Task StopAsync(CancellationToken stoppingToken)
        {
            if (_channel != null) await _channel.CloseAsync();
            if (_connection != null) await _connection.CloseAsync();

            await base.StopAsync(stoppingToken);
        }
    }
}
