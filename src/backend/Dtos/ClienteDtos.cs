using System.ComponentModel.DataAnnotations;

namespace Parking.Api.Dtos
{
    public record ClienteCreateDto([Required, MaxLength(100)] string Nome, [Required, MaxLength(11)] string Telefone, [MaxLength(400)] string? Endereco, bool Mensalista, decimal? ValorMensalidade);
    public record ClienteUpdateDto([Required, MaxLength(100)] string Nome, [Required, MaxLength(11)] string Telefone, [MaxLength(400)] string? Endereco, bool Mensalista, decimal? ValorMensalidade);
}
