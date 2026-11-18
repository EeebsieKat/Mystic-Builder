using CUE4Parse.FileProvider;
using CUE4Parse.UE4.Assets.Exports.Texture;
using CUE4Parse.UE4.Versions;
using CUE4Parse_Conversion.Textures;
using CUE4Parse_Conversion.Options;

// Args: <mode> <pakFolder> <pattern> [outdir]
//   mode: list | extract
var mode = args.Length > 0 ? args[0] : "list";
var pakFolder = args.Length > 1 ? args[1] : ".";
var pattern = args.Length > 2 ? args[2] : "";
var outDir = args.Length > 3 ? args[3] : "extracted_out";

Console.WriteLine($"mode={mode} folder={pakFolder} pattern={pattern}");

var provider = new DefaultFileProvider(pakFolder, SearchOption.TopDirectoryOnly, true,
    new VersionContainer(EGame.GAME_UE4_27));
provider.Initialize();
await provider.MountAsync();
Console.WriteLine($"Files: {provider.Files.Count}");

var matches = provider.Files.Keys
    .Where(k => pattern.Length == 0 || k.Contains(pattern, StringComparison.OrdinalIgnoreCase))
    .Where(k => k.EndsWith(".uasset", StringComparison.OrdinalIgnoreCase) || k.EndsWith(".umap", StringComparison.OrdinalIgnoreCase))
    .OrderBy(k => k, StringComparer.OrdinalIgnoreCase)
    .ToList();
Console.WriteLine($"Matches: {matches.Count}");

if (mode == "list")
{
    foreach (var path in matches.Take(5000))
    {
        Console.WriteLine(path);
    }
    return;
}

Directory.CreateDirectory(outDir);
var saved = 0;
var failed = 0;
foreach (var path in matches)
{
    try
    {
        var objectPath = path.EndsWith(".uasset", StringComparison.OrdinalIgnoreCase)
            ? path[..^7]
            : path;
        var obj = provider.LoadPackageObject(objectPath);
        if (obj is not UTexture2D tex)
        {
            continue;
        }
        var ctexture = TextureDecoder.Decode(tex, ETexturePlatform.DesktopMobile);
        if (ctexture == null || ctexture.Data == null || ctexture.Data.Length == 0)
        {
            failed++;
            continue;
        }
        var png = EncodePng(ctexture.Width, ctexture.Height, ctexture.Data);
        var safe = path.Replace('/', Path.DirectorySeparatorChar);
        var dest = Path.Join(outDir, safe + ".png");
        Directory.CreateDirectory(Path.GetDirectoryName(dest)!);
        await File.WriteAllBytesAsync(dest, png);
        saved++;
    }
    catch (Exception ex)
    {
        failed++;
        if (failed <= 8)
        {
            Console.WriteLine($"FAIL {path}: {ex.Message}");
        }
    }
}
Console.WriteLine($"Saved {saved} textures, {failed} failed.");

/* ---------------- minimal PNG encoder (RGBA8, no dependencies) --------- */
static uint Crc32(byte[] data)
{
    uint[] table = new uint[256];
    for (uint n = 0; n < 256; n++)
    {
        uint c = n;
        for (int k = 0; k < 8; k++)
        {
            c = (c & 1) != 0 ? 0xEDB88320u ^ (c >> 1) : c >> 1;
        }
        table[n] = c;
    }
    uint crc = 0xFFFFFFFFu;
    foreach (byte b in data)
    {
        crc = table[(crc ^ b) & 0xFF] ^ (crc >> 8);
    }
    return crc ^ 0xFFFFFFFFu;
}

static byte[] Chunk(string type, byte[] data)
{
    var outp = new byte[12 + data.Length];
    BitConverter.GetBytes((uint)data.Length).Reverse().ToArray().CopyTo(outp, 0);
    var typeBytes = System.Text.Encoding.ASCII.GetBytes(type);
    typeBytes.CopyTo(outp, 4);
    data.CopyTo(outp, 8);
    var crcInput = new byte[4 + data.Length];
    typeBytes.CopyTo(crcInput, 0);
    data.CopyTo(crcInput, 4);
    BitConverter.GetBytes(Crc32(crcInput))
        .Reverse().ToArray().CopyTo(outp, 8 + data.Length);
    return outp;
}

static byte[] EncodePng(int width, int height, byte[] rgba)
{
    // scanlines with filter byte 0
    var stride = width * 4;
    var raw = new byte[(stride + 1) * height];
    for (int y = 0; y < height; y++)
    {
        raw[y * (stride + 1)] = 0;
        Array.Copy(rgba, y * stride, raw, y * (stride + 1) + 1, stride);
    }
    using var ms = new MemoryStream();
    using (var ds = new System.IO.Compression.DeflateStream(ms, System.IO.Compression.CompressionLevel.Optimal, leaveOpen: true))
    {
        ds.Write(raw, 0, raw.Length);
    }
    var rawDeflate = ms.ToArray();
    // wrap raw deflate into a zlib stream: 2-byte header + data + adler32
    var idat = new byte[2 + rawDeflate.Length + 4];
    idat[0] = 0x78;
    idat[1] = 0x01;
    rawDeflate.CopyTo(idat, 2);
    var adler = Adler32(raw);
    idat[^4] = (byte)(adler >> 24);
    idat[^3] = (byte)(adler >> 16);
    idat[^2] = (byte)(adler >> 8);
    idat[^1] = (byte)adler;

    var ihdr = new byte[13];
    BitConverter.GetBytes((uint)width).Reverse().ToArray().CopyTo(ihdr, 0);
    BitConverter.GetBytes((uint)height).Reverse().ToArray().CopyTo(ihdr, 4);
    ihdr[8] = 8;  // bit depth
    ihdr[9] = 6;  // color type RGBA
    using var png = new MemoryStream();
    png.Write(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A });
    png.Write(Chunk("IHDR", ihdr));
    png.Write(Chunk("IDAT", idat));
    png.Write(Chunk("IEND", Array.Empty<byte>()));
    return png.ToArray();
}

static uint Adler32(byte[] data)
{
    const uint modAdler = 65521;
    uint a = 1, b = 0;
    foreach (byte x in data)
    {
        a = (a + x) % modAdler;
        b = (b + a) % modAdler;
    }
    return (b << 16) | a;
}
