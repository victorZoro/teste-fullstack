using System.Text;
using Microsoft.EntityFrameworkCore;
using Parking.Api.Data;
using Parking.Api.Dtos;
using Parking.Api.Models;

namespace Parking.Api.Services
{
    public class ImportResult
    {
        public int Processados { get; set; }
        public int Inseridos { get; set; }
        public List<ImportRowError> Erros { get; set; } = new();
    }

    public record ImportRowError(int Linha, string Motivo, string? DadosRaw);

    public class ImportService
    {
        private readonly AppDbContext _db;
        private readonly ClienteService _clienteService;
        private readonly VeiculoService _veiculoService;
        private readonly ILogger<ImportService> _logger;

        public ImportService(AppDbContext db, ClienteService clienteService, VeiculoService veiculoService, ILogger<ImportService> logger)
        {
            _db = db;
            _clienteService = clienteService;
            _veiculoService = veiculoService;
            _logger = logger;
        }

        public async Task<ServiceResult<ImportResult>> ImportarCsvAsync(Stream stream)
        {
            _logger.LogInformation("Iniciando importação de CSV.");

            using var r = new StreamReader(stream, Encoding.UTF8);

            int linha = 0, processados = 0, inseridos = 0;
            var erros = new List<ImportRowError>();
            
            string? header = await r.ReadLineAsync(); // consome cabeçalho
            while (!r.EndOfStream)
            {
                linha++;
                var raw = await r.ReadLineAsync();
                if (string.IsNullOrWhiteSpace(raw)) continue;
                processados++;

                try
                {
                    // CSV: placa,modelo,ano,cliente_identificador,cliente_nome,cliente_telefone,cliente_endereco,mensalista,valor_mensalidade
                    var cols = raw.Split(',');
                    if (cols.Length < 9) throw new Exception("Formato inválido ou colunas insuficientes.");

                    var placa = cols[0];
                    var modelo = cols[1];
                    int? ano = int.TryParse(cols[2], out var _ano) ? _ano : null;
                    var cliNome = cols[4];
                    var cliTel = new string((cols[5] ?? "").Where(char.IsDigit).ToArray());
                    var cliEnd = cols[6];
                    bool mensalista = bool.TryParse(cols[7], out var m) && m;
                    decimal? valorMens = decimal.TryParse(cols[8], out var vm) ? vm : null;

                    var cliente = await _db.Clientes.FirstOrDefaultAsync(c => c.Nome == cliNome && c.Telefone == cliTel);
                    if (cliente == null)
                    {
                        var cliResult = await _clienteService.CriarAsync(new ClienteCreateDto(
                            cliNome, 
                            cliTel, 
                            cliEnd, 
                            mensalista, 
                            valorMens 
                        ));
                        
                        if (!cliResult.Success) throw new Exception($"Erro ao criar cliente: {cliResult.ErrorMessage}");
                        cliente = cliResult.Data;
                    }

                    var veiculoResult = await _veiculoService.CriarAsync(new VeiculoCreateDto(
                        placa, 
                        modelo, 
                        ano, 
                        cliente!.Id
                    ));
                    
                    if (!veiculoResult.Success) throw new Exception($"Erro ao criar veículo: {veiculoResult.ErrorMessage}");

                    inseridos++;
                }
                catch (Exception ex)
                {
                    erros.Add(new ImportRowError(linha, ex.Message, raw));
                    
                    if (erros.Count <= 10)
                    {
                        _logger.LogWarning("Erro na linha {Linha} ao processar CSV. Motivo: {Motivo}", linha, ex.Message);
                    }
                }
            }

            _logger.LogInformation("Importação CSV finalizada. Processados: {Processados}, Inseridos: {Inseridos}, Erros: {Erros}", processados, inseridos, erros.Count);

            var result = new ImportResult { Processados = processados, Inseridos = inseridos, Erros = erros };
            return ServiceResult<ImportResult>.Ok(result);
        }
    }
}
