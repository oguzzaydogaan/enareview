namespace backend.Services
{
    public interface IMessageProducer
    {
        Task PublishMessageAsync<T>(T message, string queueName);
    }
}
