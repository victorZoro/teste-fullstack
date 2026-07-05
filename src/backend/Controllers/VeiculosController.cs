using Microsoft.AspNetCore.Mvc;
using Parking.Api.Dtos;
using Parking.Api.Services;

namespace Parking.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VeiculosController : ControllerBase
    {
        private readonly VeiculoService _veiculoService;

        public VeiculosController(VeiculoService veiculoService)
        {
            _veiculoService = veiculoService;
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] Guid? clienteId = null)
        {
            var result = await _veiculoService.ListAsync(clienteId);
            return Ok(result.Data);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] VeiculoCreateDto dto)
        {
            var result = await _veiculoService.CriarAsync(dto);
            if (!result.Success)
            {
                if (result.ErrorType == ErrorType.Conflict) return Conflict(result.ErrorMessage);
                return BadRequest(result.ErrorMessage);
            }
            
            return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _veiculoService.GetByIdAsync(id);
            if (!result.Success) return NotFound(result.ErrorMessage);
            return Ok(result.Data);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] VeiculoUpdateDto dto)
        {
            var result = await _veiculoService.AtualizarAsync(id, dto);
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
            var result = await _veiculoService.DeletarAsync(id);
            if (!result.Success) return NotFound(result.ErrorMessage);
            return NoContent();
        }
    }
}
