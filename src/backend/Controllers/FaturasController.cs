using Microsoft.AspNetCore.Mvc;
using Parking.Api.Dtos;
using Parking.Api.Services;

namespace Parking.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FaturasController : ControllerBase
    {
        private readonly FaturamentoService _faturamentoService;

        public FaturasController(FaturamentoService faturamentoService)
        {
            _faturamentoService = faturamentoService;
        }

        [HttpPost("gerar")]
        public async Task<IActionResult> Gerar([FromBody] GerarFaturaRequest req, CancellationToken ct)
        {
            var result = await _faturamentoService.GerarAsync(req.Competencia, ct);
            if (!result.Success) return BadRequest(result.ErrorMessage);
            return Ok(new { criadas = result.Data!.Count });
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] string? competencia = null)
        {
            var result = await _faturamentoService.ListAsync(competencia);
            return Ok(result.Data);
        }

        [HttpGet("{id:guid}/placas")]
        public async Task<IActionResult> Placas(Guid id)
        {
            var result = await _faturamentoService.GetPlacasAsync(id);
            return Ok(result.Data);
        }
    }
}
