using Microsoft.AspNetCore.Mvc;
using Parking.Api.Dtos;
using Parking.Api.Services;

namespace Parking.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClientesController : ControllerBase
    {
        private readonly ClienteService _clienteService;

        public ClientesController(ClienteService clienteService)
        {
            _clienteService = clienteService;
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] int pagina = 1, [FromQuery] int tamanho = 10, [FromQuery] string? filtro = null, [FromQuery] string mensalista = "all")
        {
            var result = await _clienteService.ListAsync(pagina, tamanho, filtro, mensalista);
            return Ok(result.Data);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _clienteService.GetByIdAsync(id);
            if (!result.Success) return NotFound(result.ErrorMessage);
            return Ok(result.Data);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ClienteCreateDto dto)
        {
            var result = await _clienteService.CriarAsync(dto);
            if (!result.Success)
            {
                if (result.ErrorType == ErrorType.Conflict) return Conflict(result.ErrorMessage);
                return BadRequest(result.ErrorMessage);
            }

            return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] ClienteUpdateDto dto)
        {
            var result = await _clienteService.AtualizarAsync(id, dto);
            if (!result.Success)
            {
                if (result.ErrorType == ErrorType.NotFound) return NotFound(result.ErrorMessage);
                if (result.ErrorType == ErrorType.Conflict) return Conflict(result.ErrorMessage);
                return BadRequest(result.ErrorMessage);
            }

            return Ok(result.Data);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var result = await _clienteService.DeletarAsync(id);
            if (!result.Success) return NotFound(result.ErrorMessage);
            return NoContent();
        }
    }
}
