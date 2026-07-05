using Microsoft.EntityFrameworkCore;
using Parking.Api.Data;
using Parking.Api.Dtos;
using Parking.Api.Models;

namespace Parking.Api.Services
{
    public class ClienteService
    {
        private readonly AppDbContext _db;

        public ClienteService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<ServiceResult<object>> ListAsync(int pagina, int tamanho, string? filtro, string mensalista)
        {
            var q = _db.Clientes.AsQueryable();
            if (!string.IsNullOrWhiteSpace(filtro))
                q = q.Where(c => c.Nome.Contains(filtro));
            if (mensalista == "true") q = q.Where(c => c.Mensalista);
            if (mensalista == "false") q = q.Where(c => !c.Mensalista);

            var total = await q.CountAsync();
            var itens = await q
                .OrderBy(c => c.Nome)
                .Skip((pagina - 1) * tamanho)
                .Take(tamanho)
                .ToListAsync();

            return ServiceResult<object>.Ok(new { total, itens });
        }

        public async Task<ServiceResult<Cliente>> GetByIdAsync(Guid id)
        {
            var c = await _db.Clientes.FindAsync(id);
            if (c == null) return ServiceResult<Cliente>.Fail("Cliente não encontrado.", ErrorType.NotFound);
            return ServiceResult<Cliente>.Ok(c);
        }

        public async Task<ServiceResult<Cliente>> CriarAsync(ClienteCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nome)) return ServiceResult<Cliente>.Fail("O Nome é obrigatório.");
            if (string.IsNullOrWhiteSpace(dto.Telefone)) return ServiceResult<Cliente>.Fail("O Telefone é obrigatório.");
            if (dto.Mensalista && !dto.ValorMensalidade.HasValue) return ServiceResult<Cliente>.Fail("O Valor da Mensalidade é obrigatório para clientes mensalistas.");

            var existe = await _db.Clientes.AnyAsync(c => c.Nome == dto.Nome && c.Telefone == dto.Telefone);
            if (existe) return ServiceResult<Cliente>.Fail("Cliente já existe.", ErrorType.Conflict);

            var c = new Cliente
            {
                Nome = dto.Nome,
                Telefone = dto.Telefone,
                Endereco = dto.Endereco,
                Mensalista = dto.Mensalista,
                ValorMensalidade = dto.Mensalista ? dto.ValorMensalidade : null
            };
            _db.Clientes.Add(c);
            await _db.SaveChangesAsync();
            return ServiceResult<Cliente>.Ok(c);
        }

        public async Task<ServiceResult<Cliente>> AtualizarAsync(Guid id, ClienteUpdateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nome)) return ServiceResult<Cliente>.Fail("O Nome é obrigatório.");
            if (string.IsNullOrWhiteSpace(dto.Telefone)) return ServiceResult<Cliente>.Fail("O Telefone é obrigatório.");
            if (dto.Mensalista && !dto.ValorMensalidade.HasValue) return ServiceResult<Cliente>.Fail("O Valor da Mensalidade é obrigatório para clientes mensalistas.");

            var c = await _db.Clientes.FindAsync(id);
            if (c == null) return ServiceResult<Cliente>.Fail("Cliente não encontrado.", ErrorType.NotFound);

            var existe = await _db.Clientes.AnyAsync(x => x.Id != id && x.Nome == dto.Nome && x.Telefone == dto.Telefone);
            if (existe) return ServiceResult<Cliente>.Fail("Já existe um outro cliente cadastrado com este Nome e Telefone.", ErrorType.Conflict);

            c.Nome = dto.Nome;
            c.Telefone = dto.Telefone;
            c.Endereco = dto.Endereco;
            c.Mensalista = dto.Mensalista;
            c.ValorMensalidade = dto.Mensalista ? dto.ValorMensalidade : null;

            await _db.SaveChangesAsync();
            return ServiceResult<Cliente>.Ok(c);
        }

        public async Task<ServiceResult<bool>> DeletarAsync(Guid id)
        {
            var c = await _db.Clientes.FindAsync(id);
            if (c == null) return ServiceResult<bool>.Fail("Cliente não encontrado.", ErrorType.NotFound);

            _db.Clientes.Remove(c);
            await _db.SaveChangesAsync();
            return ServiceResult<bool>.Ok(true);
        }
    }
}
