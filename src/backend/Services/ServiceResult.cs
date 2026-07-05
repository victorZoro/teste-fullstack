namespace Parking.Api.Services
{
    public enum ErrorType
    {
        None,
        Validation,
        Conflict,
        NotFound
    }

    public class ServiceResult<T>
    {
        public bool Success => ErrorType == ErrorType.None;
        public ErrorType ErrorType { get; set; } = ErrorType.None;
        public string ErrorMessage { get; set; } = string.Empty;
        public T? Data { get; set; }

        public static ServiceResult<T> Ok(T data) => new() { Data = data };
        public static ServiceResult<T> Fail(string message, ErrorType type = ErrorType.Validation) 
            => new() { ErrorMessage = message, ErrorType = type };
    }
}
