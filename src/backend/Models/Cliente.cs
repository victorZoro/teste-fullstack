using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Parking.Api.Models
{
    public class Cliente
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        [Required, MaxLength(100)] public string Nome { get; set; } = string.Empty;
        [Required, MaxLength(11)] public string Telefone { get; set; } = string.Empty;
        [MaxLength(400)] public string? Endereco { get; set; }
        public bool Mensalista { get; set; }
        [Column(TypeName = "decimal(8,2)")] public decimal? ValorMensalidade { get; set; }
        public DateTime DataInclusao { get; set; } = DateTime.UtcNow;

        public List<Veiculo> Veiculos { get; set; } = new();
    }
}
