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

        public override async Task StopAsync(CancellationToken stoppingToken)
        {
            if (_channel != null) await _channel.CloseAsync();
            if (_connection != null) await _connection.CloseAsync();

            await base.StopAsync(stoppingToken);
        }
    }
}
