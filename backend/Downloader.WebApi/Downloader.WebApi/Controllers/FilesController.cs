using Downloader.WebApi.Storage;
using Microsoft.AspNetCore.Mvc;

namespace Downloader.WebApi.Controllers;

[ApiController]
[Route("files")]
public class FilesController(IFileStorage fileStorage) : ControllerBase
{
    [HttpGet("{**storageKey}")]
    public async Task<IActionResult> GetFile(string storageKey)
    {
        if (string.IsNullOrWhiteSpace(storageKey))
        {
            return NotFound();
        }

        try
        {
            var file = await fileStorage.DownloadAsync(storageKey, HttpContext.RequestAborted);
            return File(file.Stream, file.ContentType, file.FileName, enableRangeProcessing: true);
        }
        catch (FileNotFoundException)
        {
            return NotFound();
        }
    }
}
