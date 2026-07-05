
using Microsoft.EntityFrameworkCore;
using Parking.Api.Data;
using Parking.Api.Models;

namespace Parking.Api.Services
{
    public class FaturamentoService
    {
        private readonly AppDbContext _db;
        public FaturamentoService(AppDbContext db) => _db = db;

        public async Task<ServiceResult<List<Fatura>>> GerarAsync(string competencia, CancellationToken ct = default)
        {
            // competencia formato yyyy-MM
            var part = competencia.Split('-');
            var ano = int.Parse(part[0]);
            var mes = int.Parse(part[1]);
            var ultimoDia = DateTime.DaysInMonth(ano, mes);
            var corte = new DateTime(ano, mes, ultimoDia, 23, 59, 59, DateTimeKind.Utc);

            var mensalistas = await _db.Clientes
                .Where(c => c.Mensalista)
                .AsNoTracking()
                .ToListAsync(ct);

            var criadas = new List<Fatura>();

            foreach (var cli in mensalistas)
            {
                var existente = await _db.Faturas
                    .FirstOrDefaultAsync(f => f.ClienteId == cli.Id && f.Competencia == competencia, ct);
                if (existente != null) continue; // idempotência simples

                var inicioMes = new DateTime(ano, mes, 1, 0, 0, 0, DateTimeKind.Utc);
                var fimMes = new DateTime(ano, mes, ultimoDia, 23, 59, 59, DateTimeKind.Utc);
                var totalDiasNoMes = (decimal)ultimoDia;

                var historico = await _db.Set<VeiculoClienteHistorico>()
                    .Where(h => h.ClienteId == cli.Id
                             && h.DataInicio <= fimMes
                             && (h.DataFim == null || h.DataFim >= inicioMes))
                    .ToListAsync(ct);

                decimal valorTotal = 0m;
                var veiculosFaturados = new HashSet<Guid>();

                foreach (var h in historico)
                {
                    var inicioVigencia = h.DataInicio < inicioMes ? inicioMes : h.DataInicio;
                    var fimVigencia = (h.DataFim == null || h.DataFim > fimMes) ? fimMes : h.DataFim.Value;

                    var diasAtivos = (fimVigencia.Date - inicioVigencia.Date).Days + 1;
                    if (diasAtivos < 0) diasAtivos = 0;

                    var proporcao = diasAtivos / totalDiasNoMes;
                    valorTotal += (cli.ValorMensalidade ?? 0m) * proporcao;
                    veiculosFaturados.Add(h.VeiculoId);
                }

                valorTotal = Math.Round(valorTotal, 2);

                var fat = new Fatura
                {
                    Competencia = competencia,
                    ClienteId = cli.Id,
                    Valor = valorTotal,
                    Observacao = $"Fatura calculada proporcionalmente para {veiculosFaturados.Count} veículo(s)."
                };

                foreach (var id in veiculosFaturados)
                    fat.Veiculos.Add(new FaturaVeiculo { FaturaId = fat.Id, VeiculoId = id });

                _db.Faturas.Add(fat);
                criadas.Add(fat);
            }

            await _db.SaveChangesAsync(ct);
            return ServiceResult<List<Fatura>>.Ok(criadas);
        }

        public async Task<ServiceResult<object>> ListAsync(string? competencia = null)
        {
            var q = _db.Faturas.AsQueryable();
            if (!string.IsNullOrWhiteSpace(competencia)) q = q.Where(f => f.Competencia == competencia);
            var list = await q
                .OrderByDescending(f => f.CriadaEm)
                .Select(f => new {
                    f.Id, f.Competencia, f.ClienteId, f.Valor, f.CriadaEm,
                    qtdVeiculos = _db.FaturasVeiculos.Count(x => x.FaturaId == f.Id)
                })
                .ToListAsync();
            return ServiceResult<object>.Ok(list);
        }

        public async Task<ServiceResult<List<string>>> GetPlacasAsync(Guid id)
        {
            var placas = await _db.FaturasVeiculos
                .Where(x => x.FaturaId == id)
                .Join(_db.Veiculos, fv => fv.VeiculoId, v => v.Id, (fv, v) => v.Placa)
                .ToListAsync();
            return ServiceResult<List<string>>.Ok(placas);
        }
    }
}
