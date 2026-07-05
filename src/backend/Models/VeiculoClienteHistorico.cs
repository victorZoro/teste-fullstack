using System.ComponentModel.DataAnnotations;

namespace Parking.Api.Models
{
    public class VeiculoClienteHistorico
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        [Required] public Guid VeiculoId { get; set; }
        [Required] public Guid ClienteId { get; set; }
        public DateTime DataInicio { get; set; }
        public DateTime? DataFim { get; set; }

        public Veiculo? Veiculo { get; set; }
        public Cliente? Cliente { get; set; }
    }
}
