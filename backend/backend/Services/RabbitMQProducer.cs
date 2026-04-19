using RabbitMQ.Client;
using System.Text;
using System.Text.Json;

namespace backend.Services
{
    public class RabbitMQProducer : IMessageProducer
    {
        private readonly IConfiguration _configuration;

        public RabbitMQProducer(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task PublishMessageAsync<T>(T message, string queueName)
        {
            var hostname = _configuration["RabbitMQ:Hostname"] ?? "localhost";
            var factory = new ConnectionFactory { HostName = hostname };

            await using var connection = await factory.CreateConnectionAsync();
            await using var channel = await connection.CreateChannelAsync();

            await channel.QueueDeclareAsync(
                queue: queueName,
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: null);

            var json = JsonSerializer.Serialize(message);
            var body = Encoding.UTF8.GetBytes(json);

            var props = new BasicProperties
            {
                Persistent = true
            };

            await channel.BasicPublishAsync(
                exchange: string.Empty,
                routingKey: queueName,
                mandatory: false,
                basicProperties: props,
                body: body);
        }
    }
}
