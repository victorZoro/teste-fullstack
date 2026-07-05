
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Parking.Api.Data;
using Parking.Api.Dtos;
using Parking.Api.Models;
using Parking.Api.Services;

namespace Parking.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VeiculosController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly PlacaService _placa;
        public VeiculosController(AppDbContext db, PlacaService placa) { _db = db; _placa = placa; }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] Guid? clienteId = null)
        {
            var q = _db.Veiculos.AsQueryable();
            if (clienteId.HasValue) q = q.Where(v => v.ClienteId == clienteId.Value);
            var list = await q.OrderBy(v => v.Placa).ToListAsync();
            return Ok(list);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] VeiculoCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Placa)) return BadRequest("A Placa é obrigatória.");
            if (dto.ClienteId == Guid.Empty) return BadRequest("O Cliente é obrigatório.");

            var placa = _placa.Sanitizar(dto.Placa);
            if (!_placa.EhValida(placa)) return BadRequest("Placa inválida.");
            if (await _db.Veiculos.AnyAsync(v => v.Placa == placa)) return Conflict("Placa já existe.");

            using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                var v = new Veiculo { Placa = placa, Modelo = dto.Modelo, Ano = dto.Ano, ClienteId = dto.ClienteId };
                _db.Veiculos.Add(v);

                var historico = new VeiculoClienteHistorico 
                { 
                    VeiculoId = v.Id, 
                    ClienteId = v.ClienteId, 
                    DataInicio = v.DataInclusao 
                };
                _db.VeiculoClienteHistoricos.Add(historico);

                await _db.SaveChangesAsync();
                await transaction.CommitAsync();
                
                return CreatedAtAction(nameof(GetById), new { id = v.Id }, v);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var v = await _db.Veiculos.FindAsync(id);
            return v == null ? NotFound() : Ok(v);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] VeiculoUpdateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Placa)) return BadRequest("A Placa é obrigatória.");
            if (dto.ClienteId == Guid.Empty) return BadRequest("O Cliente é obrigatório.");

            var v = await _db.Veiculos.FindAsync(id);
            if (v == null) return NotFound();
            var placa = _placa.Sanitizar(dto.Placa);
            if (!_placa.EhValida(placa)) return BadRequest("Placa inválida.");
            if (await _db.Veiculos.AnyAsync(x => x.Placa == placa && x.Id != id)) return Conflict("Placa já existe.");

            using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                if (v.ClienteId != dto.ClienteId)
                {
                    var historicoAtual = await _db.VeiculoClienteHistoricos
                        .FirstOrDefaultAsync(h => h.VeiculoId == id && h.DataFim == null);
                    
                    var dataMudanca = DateTime.UtcNow;

                    if (historicoAtual != null)
                    {
                        historicoAtual.DataFim = dataMudanca;
                    }

                    var novoHistorico = new VeiculoClienteHistorico
                    {
                        VeiculoId = id,
                        ClienteId = dto.ClienteId,
                        DataInicio = dataMudanca
                    };
                    _db.VeiculoClienteHistoricos.Add(novoHistorico);
                }

                v.Placa = placa;
                v.Modelo = dto.Modelo;
                v.Ano = dto.Ano;
                v.ClienteId = dto.ClienteId;
                
                await _db.SaveChangesAsync();
                await transaction.CommitAsync();
                
                return Ok(v);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var v = await _db.Veiculos.FindAsync(id);
            if (v == null) return NotFound();
            _db.Veiculos.Remove(v);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
