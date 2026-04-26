using Downloader.Data.DTOs;
using Downloader.Data.Models;
using Downloader.DataApi.Repos;

namespace Downloader.DataApi.Services;

public interface IProtocolService
{
    Task<List<ProtocolDto>> GetAllAsync();
    Task<ProtocolDto?> GetByIdAsync(string id);
    Task<ProtocolDto?> CreateAsync(ProtocolCreateDto dto);
    Task<bool> UpdateAsync(string id, ProtocolUpdateDto dto);
    Task<bool> DeleteAsync(string id);
}

public class ProtocolService(IProtocolRepo protocolRepo, IAppRepo appRepo) : IProtocolService
{
    public async Task<List<ProtocolDto>> GetAllAsync()
    {
        var protocols = await protocolRepo.GetAllAsync();
        return protocols.Select(p => new ProtocolDto
        {
            Id = p.Id,
            Name = p.Name,
            Description = p.Description,
            Context = p.Context
        }).ToList();
    }

    public async Task<ProtocolDto?> GetByIdAsync(string id)
    {
        var protocol = await protocolRepo.GetByIdAsync(id);
        if (protocol == null) return null;

        return new ProtocolDto
        {
            Id = protocol.Id,
            Name = protocol.Name,
            Description = protocol.Description,
            Context = protocol.Context
        };
    }

    public async Task<ProtocolDto?> CreateAsync(ProtocolCreateDto dto)
    {
        var app = await appRepo.GetByIdAsync(dto.AppId);
        if (app == null) return null;

        var protocol = new ProtocolModel
        {
            Id = Guid.NewGuid().ToString(),
            Name = dto.Name,
            Description = dto.Description,
            Context = dto.Context,
            AppId = app.Id
        };

        await protocolRepo.CreateAsync(protocol);

        return new ProtocolDto
        {
            Id = protocol.Id,
            Name = protocol.Name,
            Description = protocol.Description,
            Context = protocol.Context
        };
    }

    public async Task<bool> UpdateAsync(string id, ProtocolUpdateDto dto)
    {
        var protocol = await protocolRepo.GetByIdAsync(id);
        if (protocol == null) return false;

        protocol.Name = dto.Name;
        protocol.Description = dto.Description;
        protocol.Context = dto.Context;

        return await protocolRepo.UpdateAsync(protocol);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        return await protocolRepo.DeleteAsync(id);
    }
}
