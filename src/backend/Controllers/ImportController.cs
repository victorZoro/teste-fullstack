using Microsoft.AspNetCore.Mvc;
using Parking.Api.Services;

namespace Parking.Api.Controllers
{
    [ApiController]
    [Route("api/import")]
    public class ImportController : ControllerBase
    {
        private readonly ImportService _importService;

        public ImportController(ImportService importService)
        {
            _importService = importService;
        }

        [HttpPost("csv")]
        public async Task<IActionResult> ImportCsv()
        {
            if (!Request.HasFormContentType || Request.Form.Files.Count == 0)
                return BadRequest("Envie um arquivo CSV no campo 'file'.");

            var file = Request.Form.Files[0];
            using var stream = file.OpenReadStream();

            var result = await _importService.ImportarCsvAsync(stream);
            
            if (!result.Success) return BadRequest(result.ErrorMessage);

            return Ok(result.Data);
        }
    }
}
