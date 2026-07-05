using Microsoft.EntityFrameworkCore;
using Parking.Api.Data;
using Parking.Api.Dtos;
using Parking.Api.Models;

namespace Parking.Api.Services
{
    public class VeiculoService
    {
        private readonly AppDbContext _db;
        private readonly PlacaService _placa;

        public VeiculoService(AppDbContext db, PlacaService placa)
        {
            _db = db;
            _placa = placa;
        }

        public async Task<ServiceResult<List<Veiculo>>> ListAsync(Guid? clienteId)
        {
            var q = _db.Veiculos.AsQueryable();
            if (clienteId.HasValue) q = q.Where(v => v.ClienteId == clienteId.Value);
            var list = await q.OrderBy(v => v.Placa).ToListAsync();
            return ServiceResult<List<Veiculo>>.Ok(list);
        }

        public async Task<ServiceResult<Veiculo>> GetByIdAsync(Guid id)
        {
            var v = await _db.Veiculos.FindAsync(id);
            if (v == null) return ServiceResult<Veiculo>.Fail("Veículo não encontrado.", ErrorType.NotFound);
            return ServiceResult<Veiculo>.Ok(v);
        }

        public async Task<ServiceResult<Veiculo>> CriarAsync(VeiculoCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Placa)) return ServiceResult<Veiculo>.Fail("A Placa é obrigatória.");
            if (dto.ClienteId == Guid.Empty) return ServiceResult<Veiculo>.Fail("O Cliente é obrigatório.");

            var placa = _placa.Sanitizar(dto.Placa);
            if (!_placa.EhValida(placa)) return ServiceResult<Veiculo>.Fail("Placa inválida.");
            if (await _db.Veiculos.AnyAsync(v => v.Placa == placa)) return ServiceResult<Veiculo>.Fail("Placa já existe.", ErrorType.Conflict);

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
                
                return ServiceResult<Veiculo>.Ok(v);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<ServiceResult<Veiculo>> AtualizarAsync(Guid id, VeiculoUpdateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Placa)) return ServiceResult<Veiculo>.Fail("A Placa é obrigatória.");
            if (dto.ClienteId == Guid.Empty) return ServiceResult<Veiculo>.Fail("O Cliente é obrigatório.");

            var v = await _db.Veiculos.FindAsync(id);
            if (v == null) return ServiceResult<Veiculo>.Fail("Veículo não encontrado.", ErrorType.NotFound);

            var placa = _placa.Sanitizar(dto.Placa);
            if (!_placa.EhValida(placa)) return ServiceResult<Veiculo>.Fail("Placa inválida.");
            if (await _db.Veiculos.AnyAsync(x => x.Placa == placa && x.Id != id)) return ServiceResult<Veiculo>.Fail("Placa já existe.", ErrorType.Conflict);

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
                
                return ServiceResult<Veiculo>.Ok(v);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<ServiceResult<bool>> DeletarAsync(Guid id)
        {
            var v = await _db.Veiculos.FindAsync(id);
            if (v == null) return ServiceResult<bool>.Fail("Veículo não encontrado.", ErrorType.NotFound);
            
            _db.Veiculos.Remove(v);
            await _db.SaveChangesAsync();
            return ServiceResult<bool>.Ok(true);
        }
    }
}
