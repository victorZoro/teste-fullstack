
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Parking.Api.Data;
using Parking.Api.Models;
using Parking.Api.Services;
using System.Text;

namespace Parking.Api.Controllers
{
    public record ImportRowError(int Linha, string Motivo, string? DadosRaw);

    [ApiController]
    [Route("api/import")]
    public class ImportController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly PlacaService _placa;
        private readonly ILogger<ImportController> _logger;

        public ImportController(AppDbContext db, PlacaService placa, ILogger<ImportController> logger) 
        { 
            _db = db; 
            _placa = placa; 
            _logger = logger;
        }

        [HttpPost("csv")]
        public async Task<IActionResult> ImportCsv()
        {
            if (!Request.HasFormContentType || Request.Form.Files.Count == 0)
                return BadRequest("Envie um arquivo CSV no campo 'file'.");

            _logger.LogInformation("Iniciando importação de CSV.");

            var file = Request.Form.Files[0];
            using var s = file.OpenReadStream();
            using var r = new StreamReader(s, Encoding.UTF8);

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
                    // CSV simples separado por vírgula: placa,modelo,ano,cliente_identificador,cliente_nome,cliente_telefone,cliente_endereco,mensalista,valor_mensalidade
                    var cols = raw.Split(',');
                    if (cols.Length < 9) throw new Exception("Formato inválido ou colunas insuficientes.");

                    var placa = _placa.Sanitizar(cols[0]);
                    var modelo = cols[1];
                    int? ano = int.TryParse(cols[2], out var _ano) ? _ano : null;
                    var cliId = cols[3];
                    var cliNome = cols[4];
                    var cliTel = new string((cols[5] ?? "").Where(char.IsDigit).ToArray());
                    var cliEnd = cols[6];
                    bool mensalista = bool.TryParse(cols[7], out var m) && m;
                    decimal? valorMens = decimal.TryParse(cols[8], out var vm) ? vm : null;

                    if (!_placa.EhValida(placa)) throw new Exception("Placa inválida");
                    if (await _db.Veiculos.AnyAsync(v => v.Placa == placa)) throw new Exception("Placa duplicada");

                    var cliente = await _db.Clientes.FirstOrDefaultAsync(c => c.Nome == cliNome && c.Telefone == cliTel);
                    if (cliente == null)
                    {
                        cliente = new Cliente { Nome = cliNome, Telefone = cliTel, Endereco = cliEnd, Mensalista = mensalista, ValorMensalidade = valorMens };
                        _db.Clientes.Add(cliente);
                        await _db.SaveChangesAsync();
                    }

                    var v = new Veiculo { Placa = placa, Modelo = modelo, Ano = ano, ClienteId = cliente.Id };
                    _db.Veiculos.Add(v);
                    await _db.SaveChangesAsync();
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

            return Ok(new { processados, inseridos, erros });
        }
    }
}
