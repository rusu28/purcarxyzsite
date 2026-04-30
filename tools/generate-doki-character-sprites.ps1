param(
    [string]$Workspace = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'

$assetRoot = Join-Path $Workspace 'public\dokisecret\assets\custom'
$generatedRoot = Join-Path $assetRoot 'generated'
$dictionaryPath = Join-Path $Workspace 'public\dokisecret\scripts\dictionary.js'

if (-not (Test-Path -LiteralPath $assetRoot)) {
    New-Item -ItemType Directory -Force -Path $assetRoot | Out-Null
}

if (Test-Path -LiteralPath $generatedRoot) {
    $resolvedGenerated = (Resolve-Path $generatedRoot).Path
    if (-not $resolvedGenerated.StartsWith($Workspace, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Generated asset root resolved outside workspace.'
    }
    Remove-Item -LiteralPath $generatedRoot -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $generatedRoot | Out-Null

Add-Type -ReferencedAssemblies System.Drawing.dll,System.Net.Http.dll -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Net.Http;
using System.Runtime.InteropServices;

public static class DokiSpriteComposerTool
{
    private static readonly HttpClient Client = new HttpClient();
    private static readonly Dictionary<string, Bitmap> SourceCache = new Dictionary<string, Bitmap>();
    private static readonly Dictionary<string, Rectangle> SourceCropCache = new Dictionary<string, Rectangle>();

    static DokiSpriteComposerTool()
    {
        Client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0");
        Client.DefaultRequestHeaders.Referrer = new Uri("https://imageshack.com/");
        Client.DefaultRequestHeaders.Accept.ParseAdd("image/png,image/*;q=0.8,*/*;q=0.5");
        Client.Timeout = TimeSpan.FromSeconds(35);
    }

    public static void Generate(string originalSpec, string sourcePath, string outputPath)
    {
        using (Bitmap target = LoadBitmap(originalSpec))
        {
            Bitmap source = GetSource(sourcePath);
            Rectangle sourceCrop = GetSourceCrop(sourcePath, source);

            PixelBuffer targetPixels = LockRead(target);
            bool hasTargetTransparency = HasTransparency(targetPixels);
            Rectangle maskBounds = GetMaskBounds(targetPixels, hasTargetTransparency);
            UnlockRead(target, targetPixels);

            if (maskBounds.Width <= 0 || maskBounds.Height <= 0) return;

            using (Bitmap texture = new Bitmap(target.Width, target.Height, PixelFormat.Format32bppArgb))
            {
                using (Graphics g = Graphics.FromImage(texture))
                {
                    g.Clear(Color.Transparent);
                    g.CompositingQuality = CompositingQuality.HighQuality;
                    g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                    g.SmoothingMode = SmoothingMode.HighQuality;
                    g.PixelOffsetMode = PixelOffsetMode.HighQuality;

                    float scale = Math.Min(maskBounds.Width / (float)sourceCrop.Width, maskBounds.Height / (float)sourceCrop.Height) * 1.04f;
                    int destW = Math.Max(1, (int)Math.Ceiling(sourceCrop.Width * scale));
                    int destH = Math.Max(1, (int)Math.Ceiling(sourceCrop.Height * scale));
                    int destX = maskBounds.Left + (maskBounds.Width - destW) / 2;
                    int destY = maskBounds.Bottom - destH;
                    g.DrawImage(source, new Rectangle(destX, destY, destW, destH), sourceCrop, GraphicsUnit.Pixel);
                }

                if (BitmapHasTransparency(source))
                {
                    Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
                    texture.Save(outputPath, ImageFormat.Png);
                    return;
                }

                using (Bitmap output = new Bitmap(target.Width, target.Height, PixelFormat.Format32bppArgb))
                {
                    PixelBuffer targetBuf = LockRead(target);
                    PixelBuffer textureBuf = LockRead(texture);
                    PixelBuffer outputBuf = LockWrite(output);

                    for (int y = 0; y < target.Height; y++)
                    {
                        int rowT = y * targetBuf.Stride;
                        int rowS = y * textureBuf.Stride;
                        int rowO = y * outputBuf.Stride;
                        for (int x = 0; x < target.Width; x++)
                        {
                            int t = rowT + x * 4;
                            int s = rowS + x * 4;
                            int o = rowO + x * 4;
                            int alpha = GetMaskAlpha(targetBuf.Bytes, t, hasTargetTransparency);

                            if (alpha <= 10)
                            {
                                outputBuf.Bytes[o + 0] = 0;
                                outputBuf.Bytes[o + 1] = 0;
                                outputBuf.Bytes[o + 2] = 0;
                                outputBuf.Bytes[o + 3] = 0;
                                continue;
                            }

                            if (textureBuf.Bytes[s + 3] <= 10)
                            {
                                outputBuf.Bytes[o + 0] = 0;
                                outputBuf.Bytes[o + 1] = 0;
                                outputBuf.Bytes[o + 2] = 0;
                                outputBuf.Bytes[o + 3] = 0;
                                continue;
                            }

                            outputBuf.Bytes[o + 0] = textureBuf.Bytes[s + 0];
                            outputBuf.Bytes[o + 1] = textureBuf.Bytes[s + 1];
                            outputBuf.Bytes[o + 2] = textureBuf.Bytes[s + 2];
                            outputBuf.Bytes[o + 3] = (byte)alpha;
                        }
                    }

                    UnlockRead(target, targetBuf);
                    UnlockRead(texture, textureBuf);
                    UnlockWrite(output, outputBuf);
                    Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
                    output.Save(outputPath, ImageFormat.Png);
                }
            }
        }
    }

    private static Bitmap GetSource(string sourcePath)
    {
        if (!SourceCache.ContainsKey(sourcePath))
        {
            Bitmap source = LoadBitmap(sourcePath);
            PrepareSourceInPlace(source, sourcePath);
            SourceCache[sourcePath] = source;
        }
        return SourceCache[sourcePath];
    }

    private static Rectangle GetSourceCrop(string sourcePath, Bitmap source)
    {
        if (SourceCropCache.ContainsKey(sourcePath)) return SourceCropCache[sourcePath];

        PixelBuffer buf = LockRead(source);
        bool hasTransparency = HasTransparency(buf);
        int minX = source.Width, minY = source.Height, maxX = -1, maxY = -1;

        for (int y = 0; y < source.Height; y++)
        {
            int row = y * buf.Stride;
            for (int x = 0; x < source.Width; x++)
            {
                int i = row + x * 4;
                byte b = buf.Bytes[i + 0];
                byte g = buf.Bytes[i + 1];
                byte r = buf.Bytes[i + 2];
                byte a = buf.Bytes[i + 3];
                bool visible = hasTransparency ? a > 15 : !IsNearlyWhite(r, g, b);
                if (visible)
                {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }

        UnlockRead(source, buf);

        Rectangle crop;
        if (maxX < minX || maxY < minY)
        {
            crop = new Rectangle(0, 0, source.Width, source.Height);
        }
        else
        {
            int padX = Math.Max(8, (maxX - minX + 1) / 25);
            int padY = Math.Max(8, (maxY - minY + 1) / 25);
            minX = Math.Max(0, minX - padX);
            minY = Math.Max(0, minY - padY);
            maxX = Math.Min(source.Width - 1, maxX + padX);
            maxY = Math.Min(source.Height - 1, maxY + padY);
            crop = Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1);
            if (crop.Width < source.Width / 4 || crop.Height < source.Height / 4)
            {
                crop = new Rectangle(0, 0, source.Width, source.Height);
            }
        }

        SourceCropCache[sourcePath] = crop;
        return crop;
    }

    private static void PrepareSourceInPlace(Bitmap source, string sourcePath)
    {
        PixelBuffer buf = LockWriteRead(source);
        bool hasTransparency = HasTransparency(buf);
        bool keyWhite = !hasTransparency && BorderBrightness(buf) > 218;

        if (keyWhite)
        {
            bool[] remove = new bool[buf.Width * buf.Height];
            Queue<int> queue = new Queue<int>();

            Action<int, int> enqueue = (x, y) =>
            {
                if (x < 0 || y < 0 || x >= buf.Width || y >= buf.Height) return;
                int offset = y * buf.Width + x;
                if (remove[offset]) return;
                int i = y * buf.Stride + x * 4;
                if (!IsBackgroundCandidate(buf.Bytes, i)) return;
                if (IsProtectedForegroundPixel(sourcePath, x, y, buf.Width, buf.Height)) return;
                remove[offset] = true;
                queue.Enqueue(offset);
            };

            for (int x = 0; x < buf.Width; x++)
            {
                enqueue(x, 0);
            }
            for (int y = 0; y < buf.Height; y++)
            {
                enqueue(0, y);
                enqueue(buf.Width - 1, y);
            }

            while (queue.Count > 0)
            {
                int offset = queue.Dequeue();
                int x = offset % buf.Width;
                int y = offset / buf.Width;
                enqueue(x + 1, y);
                enqueue(x - 1, y);
                enqueue(x, y + 1);
                enqueue(x, y - 1);
            }

            for (int y = 0; y < buf.Height; y++)
            {
                int row = y * buf.Stride;
                for (int x = 0; x < buf.Width; x++)
                {
                    if (!remove[y * buf.Width + x]) continue;
                    int i = row + x * 4;
                    buf.Bytes[i + 3] = 0;
                }
            }
        }

        if (sourcePath.IndexOf("purcarmonika", StringComparison.OrdinalIgnoreCase) >= 0)
        {
            ApplyMonikaPortraitMask(buf);
        }

        KeepLargestVisibleComponent(buf);
        UnlockWrite(source, buf);
    }

    private static void ApplyMonikaPortraitMask(PixelBuffer buf)
    {
        for (int y = 0; y < buf.Height; y++)
        {
            int row = y * buf.Stride;
            float ny = y / (float)Math.Max(1, buf.Height - 1);
            for (int x = 0; x < buf.Width; x++)
            {
                float nx = x / (float)Math.Max(1, buf.Width - 1);
                if (IsMonikaForeground(nx, ny)) continue;
                buf.Bytes[row + x * 4 + 3] = 0;
            }
        }
    }

    private static bool IsMonikaForeground(float nx, float ny)
    {
        PointF[] torso = new PointF[]
        {
            new PointF(0.36f, 0.23f),
            new PointF(0.62f, 0.23f),
            new PointF(0.78f, 0.52f),
            new PointF(0.90f, 1.00f),
            new PointF(0.10f, 1.00f),
            new PointF(0.20f, 0.52f)
        };
        PointF[] leftArm = new PointF[]
        {
            new PointF(0.00f, 0.35f),
            new PointF(0.24f, 0.35f),
            new PointF(0.30f, 0.60f),
            new PointF(0.08f, 0.64f),
            new PointF(0.00f, 0.54f)
        };
        PointF[] rightArm = new PointF[]
        {
            new PointF(0.72f, 0.35f),
            new PointF(1.00f, 0.35f),
            new PointF(1.00f, 0.54f),
            new PointF(0.88f, 0.63f),
            new PointF(0.70f, 0.58f)
        };

        return InEllipse(nx, ny, 0.48f, 0.155f, 0.18f, 0.105f) ||
            InEllipse(nx, ny, 0.49f, 0.24f, 0.11f, 0.045f) ||
            PointInPolygon(nx, ny, torso) ||
            PointInPolygon(nx, ny, leftArm) ||
            PointInPolygon(nx, ny, rightArm);
    }

    private static bool InEllipse(float x, float y, float centerX, float centerY, float radiusX, float radiusY)
    {
        float dx = (x - centerX) / radiusX;
        float dy = (y - centerY) / radiusY;
        return dx * dx + dy * dy <= 1.0f;
    }

    private static bool PointInPolygon(float x, float y, PointF[] polygon)
    {
        bool inside = false;
        for (int i = 0, j = polygon.Length - 1; i < polygon.Length; j = i++)
        {
            bool crosses = ((polygon[i].Y > y) != (polygon[j].Y > y)) &&
                (x < (polygon[j].X - polygon[i].X) * (y - polygon[i].Y) / ((polygon[j].Y - polygon[i].Y) + 0.000001f) + polygon[i].X);
            if (crosses) inside = !inside;
        }
        return inside;
    }

    private static void KeepLargestVisibleComponent(PixelBuffer buf)
    {
        int total = buf.Width * buf.Height;
        bool[] visited = new bool[total];
        int[] labels = new int[total];
        int[] queue = new int[total];
        int bestLabel = 0;
        int bestCount = 0;
        int label = 0;

        for (int y = 0; y < buf.Height; y++)
        {
            int row = y * buf.Stride;
            for (int x = 0; x < buf.Width; x++)
            {
                int start = y * buf.Width + x;
                if (visited[start]) continue;
                visited[start] = true;
                if (buf.Bytes[row + x * 4 + 3] <= 20) continue;

                label++;
                int head = 0;
                int tail = 0;
                int count = 0;
                queue[tail++] = start;
                labels[start] = label;

                while (head < tail)
                {
                    int current = queue[head++];
                    count++;
                    int cx = current % buf.Width;
                    int cy = current / buf.Width;

                    EnqueueVisible(cx + 1, cy, buf, visited, labels, queue, ref tail, label);
                    EnqueueVisible(cx - 1, cy, buf, visited, labels, queue, ref tail, label);
                    EnqueueVisible(cx, cy + 1, buf, visited, labels, queue, ref tail, label);
                    EnqueueVisible(cx, cy - 1, buf, visited, labels, queue, ref tail, label);
                }

                if (count > bestCount)
                {
                    bestCount = count;
                    bestLabel = label;
                }
            }
        }

        if (bestLabel == 0) return;

        for (int y = 0; y < buf.Height; y++)
        {
            int row = y * buf.Stride;
            for (int x = 0; x < buf.Width; x++)
            {
                int offset = y * buf.Width + x;
                if (labels[offset] == bestLabel) continue;
                int i = row + x * 4;
                buf.Bytes[i + 0] = 0;
                buf.Bytes[i + 1] = 0;
                buf.Bytes[i + 2] = 0;
                buf.Bytes[i + 3] = 0;
            }
        }
    }

    private static void EnqueueVisible(int x, int y, PixelBuffer buf, bool[] visited, int[] labels, int[] queue, ref int tail, int label)
    {
        if (x < 0 || y < 0 || x >= buf.Width || y >= buf.Height) return;
        int offset = y * buf.Width + x;
        if (visited[offset]) return;
        visited[offset] = true;
        int i = y * buf.Stride + x * 4;
        if (buf.Bytes[i + 3] <= 20) return;
        labels[offset] = label;
        queue[tail++] = offset;
    }

    private static Bitmap LoadBitmap(string spec)
    {
        if (spec.StartsWith("http://") || spec.StartsWith("https://"))
        {
            byte[] bytes = Client.GetByteArrayAsync(spec).GetAwaiter().GetResult();
            using (MemoryStream ms = new MemoryStream(bytes))
            using (Bitmap raw = new Bitmap(ms))
            {
                return To32(raw);
            }
        }

        using (Bitmap raw = new Bitmap(spec))
        {
            return To32(raw);
        }
    }

    private static Bitmap To32(Bitmap raw)
    {
        Bitmap clone = new Bitmap(raw.Width, raw.Height, PixelFormat.Format32bppArgb);
        using (Graphics g = Graphics.FromImage(clone))
        {
            g.DrawImage(raw, 0, 0, raw.Width, raw.Height);
        }
        return clone;
    }

    private static bool HasTransparency(PixelBuffer buf)
    {
        for (int y = 0; y < buf.Height; y++)
        {
            int row = y * buf.Stride;
            for (int x = 0; x < buf.Width; x++)
            {
                if (buf.Bytes[row + x * 4 + 3] < 250) return true;
            }
        }
        return false;
    }

    private static bool BitmapHasTransparency(Bitmap bmp)
    {
        PixelBuffer buf = LockRead(bmp);
        bool result = HasTransparency(buf);
        UnlockRead(bmp, buf);
        return result;
    }

    private static int BorderBrightness(PixelBuffer buf)
    {
        long total = 0;
        long count = 0;
        int xStep = Math.Max(1, buf.Width / 80);
        int yStep = Math.Max(1, buf.Height / 80);

        for (int x = 0; x < buf.Width; x += xStep)
        {
            total += PixelBrightness(buf, x, 0);
            total += PixelBrightness(buf, x, buf.Height - 1);
            count += 2;
        }
        for (int y = 0; y < buf.Height; y += yStep)
        {
            total += PixelBrightness(buf, 0, y);
            total += PixelBrightness(buf, buf.Width - 1, y);
            count += 2;
        }

        return (int)(total / Math.Max(1, count));
    }

    private static int PixelBrightness(PixelBuffer buf, int x, int y)
    {
        int i = y * buf.Stride + x * 4;
        return (buf.Bytes[i + 0] + buf.Bytes[i + 1] + buf.Bytes[i + 2]) / 3;
    }

    private static bool IsBackgroundCandidate(byte[] bytes, int i)
    {
        int b = bytes[i + 0];
        int g = bytes[i + 1];
        int r = bytes[i + 2];
        int max = Math.Max(r, Math.Max(g, b));
        int min = Math.Min(r, Math.Min(g, b));
        int avg = (r + g + b) / 3;
        return avg > 214 && (max - min) < 42;
    }

    private static bool IsProtectedForegroundPixel(string sourcePath, int x, int y, int width, int height)
    {
        return false;
    }

    private static Rectangle GetMaskBounds(PixelBuffer buf, bool hasTransparency)
    {
        int minX = buf.Width, minY = buf.Height, maxX = -1, maxY = -1;
        for (int y = 0; y < buf.Height; y++)
        {
            int row = y * buf.Stride;
            for (int x = 0; x < buf.Width; x++)
            {
                int i = row + x * 4;
                int alpha = GetMaskAlpha(buf.Bytes, i, hasTransparency);
                if (alpha > 15)
                {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }
        if (maxX < minX || maxY < minY) return Rectangle.Empty;
        return Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1);
    }

    private static int GetMaskAlpha(byte[] bytes, int i, bool hasTransparency)
    {
        if (hasTransparency) return bytes[i + 3];
        return IsNearlyWhite(bytes[i + 2], bytes[i + 1], bytes[i + 0]) ? 0 : 255;
    }

    private static bool IsNearlyWhite(byte r, byte g, byte b)
    {
        return r > 246 && g > 246 && b > 246;
    }

    private static PixelBuffer LockRead(Bitmap bmp)
    {
        return Lock(bmp, ImageLockMode.ReadOnly, true);
    }

    private static PixelBuffer LockWrite(Bitmap bmp)
    {
        return Lock(bmp, ImageLockMode.WriteOnly, false);
    }

    private static PixelBuffer LockWriteRead(Bitmap bmp)
    {
        return Lock(bmp, ImageLockMode.ReadWrite, true);
    }

    private static PixelBuffer Lock(Bitmap bmp, ImageLockMode mode, bool read)
    {
        Rectangle rect = new Rectangle(0, 0, bmp.Width, bmp.Height);
        BitmapData data = bmp.LockBits(rect, mode, PixelFormat.Format32bppArgb);
        int bytes = Math.Abs(data.Stride) * bmp.Height;
        byte[] buffer = new byte[bytes];
        if (read) Marshal.Copy(data.Scan0, buffer, 0, bytes);
        return new PixelBuffer { Data = data, Bytes = buffer, Width = bmp.Width, Height = bmp.Height, Stride = Math.Abs(data.Stride) };
    }

    private static void UnlockRead(Bitmap bmp, PixelBuffer buf)
    {
        bmp.UnlockBits(buf.Data);
    }

    private static void UnlockWrite(Bitmap bmp, PixelBuffer buf)
    {
        Marshal.Copy(buf.Bytes, 0, buf.Data.Scan0, buf.Bytes.Length);
        bmp.UnlockBits(buf.Data);
    }

    private class PixelBuffer
    {
        public BitmapData Data;
        public byte[] Bytes;
        public int Width;
        public int Height;
        public int Stride;
    }
}
'@

function Get-Character([string]$Name) {
    $aliases = @{
        'LeftArm0.pg' = 'natsuki'
        'Y12.png' = 'natsuki'
        'Mon4' = 'monika'
        'monika1.png' = 'monika'
        'Y27' = 'natsuki'
        'Ori26.png' = 'sayori'
        'Yuvu2.png' = 'yuri'
        'Yuri_School_4.png' = 'yuri'
        ' YSSad.png' = 'yuri'
        'YCLook.png' = 'yuri'
        'YSLookaway' = 'yuri'
        'YSShy' = 'yuri'
    }

    if ($aliases.ContainsKey($Name)) { return $aliases[$Name] }
    if ($Name -cmatch '^(3aa|3bb|Ika|Mon|Monika|monika1)') { return 'monika' }
    if ($Name -cmatch '^(3a\.png|3b\.png|3c\.png|3d\.png|Ori|Say|Sayori|Yori|Z|say4|sayori-hug|sayonara)') { return 'sayori' }
    if ($Name -cmatch '^(LeftArm|Natsuki|School|Turnedaway|Arm|Casual|S\d|Y\d)') { return 'natsuki' }
    if ($Name -cmatch '^(2l1|YAngry|YBashful|YHappy|YLook|YScared|YSHappy|YShy|YSLookaway|YSmile|YSSad|YSShy|YSurp|Yunu|Yuri|Yuu|Yuvu|YWorried|YOut|YCa|YCb|YCc|YCd|YCe|YCf|YCg|YCh|YCi|YCLook|YCnun|YCo|YCp|YCq|YCScared|YCWorried)') { return 'yuri' }
    return $null
}

function Get-SafeName([string]$Name) {
    $safe = $Name -replace '[^a-zA-Z0-9._-]', '_'
    $safe = $safe -replace '\.(gif|jpe?g|webp)$', '.png'
    if ($safe.ToLowerInvariant().EndsWith('.png')) { return $safe }
    return "$safe.png"
}

function Resolve-OriginalSpec([string]$Value) {
    if ($Value -match '^https?://') { return $Value }
    if ($Value.StartsWith('/dokisecret/')) {
        return Join-Path $Workspace ('public' + ($Value -replace '/', '\'))
    }
    return $null
}

$dictionaryText = Get-Content -Raw -LiteralPath $dictionaryPath
$entries = [System.Collections.Generic.Dictionary[string, string]]::new([StringComparer]::Ordinal)
foreach ($match in [regex]::Matches($dictionaryText, '(?m)^\s*"([^"]+)"\s*:\s*(?:window\.location\.origin\s*\+\s*)?"([^"]+)"')) {
    $key = $match.Groups[1].Value
    $spec = Resolve-OriginalSpec $match.Groups[2].Value
    if ($spec -and -not $entries.ContainsKey($key)) { $entries[$key] = $spec }
}

$fallback = @{
    'LeftArm0.pg' = $entries['LeftArm0.png']
    'Y12.png' = $entries['Y11.png']
    'Schoolx.png' = $entries['Schoolw.png']
    'Mon4' = $entries['Mon4.png']
    'monika1.png' = $entries['Monika1.png']
    'Y27' = $entries['Y27.png']
    'Ori26.png' = $entries['Ori25.png']
    'Yori14.png' = $entries['Yori13.png']
    'Yuvu2.png' = Join-Path $Workspace 'public\dokisecret\api\img\Yuvu2.png'
    'Yuri_School_4.png' = $entries['Yuri_school_4.png']
    ' YSSad.png' = $entries['YSSad.png']
    'YCLook.png' = $entries['YCLook1.png']
    'YSLookaway' = $entries['YSLookaway.png']
    'YSShy' = $entries['YSShy1.png']
    'Casual' = $entries['Casual1.png']
    'S1.png' = $entries['S4.png']
}

$sourceMap = @{
    sayori = Join-Path $Workspace 'assetsforddlc\strajansayori.png'
    natsuki = Join-Path $Workspace 'assetsforddlc\guzucelNatsuki.png'
    yuri = Join-Path $Workspace 'assetsforddlc\yurirobi.png'
    monika = Join-Path $Workspace 'assetsforddlc\purcarmonika.png'
}

foreach ($character in $sourceMap.Keys) {
    New-Item -ItemType Directory -Force -Path (Join-Path $generatedRoot $character) | Out-Null
}

$allNames = New-Object System.Collections.Generic.List[string]
foreach ($key in $entries.Keys) { $allNames.Add($key) }
foreach ($key in $fallback.Keys) {
    if (-not $allNames.Contains($key)) { $allNames.Add($key) }
}

$counts = @{}
$failures = New-Object System.Collections.Generic.List[string]
$processed = 0

foreach ($name in ($allNames | Sort-Object)) {
    $character = Get-Character $name
    if (-not $character) { continue }

    $originalSpec = if ($entries.ContainsKey($name)) { $entries[$name] } else { $fallback[$name] }
    if (-not $originalSpec) {
        $failures.Add("${name}: missing original")
        continue
    }
    if (($originalSpec -notmatch '^https?://') -and -not (Test-Path -LiteralPath $originalSpec)) {
        $failures.Add("${name}: original not found $originalSpec")
        continue
    }

    $outputPath = Join-Path (Join-Path $generatedRoot $character) (Get-SafeName $name)
    try {
        [DokiSpriteComposerTool]::Generate($originalSpec, $sourceMap[$character], $outputPath)
        $counts[$character] = 1 + [int]$counts[$character]
    }
    catch {
        $failures.Add("${name}: $($_.Exception.Message)")
    }

    $processed++
    if (($processed % 50) -eq 0) { Write-Host "processed $processed sprites" }
}

$representatives = @{
    sayori = 'Sayori1.png'
    natsuki = 'NatsukiCrossedArms.png'
    yuri = 'Yuri_school_1.png'
    monika = 'Monika1.png'
}

foreach ($character in $representatives.Keys) {
    $characterDir = Join-Path $generatedRoot $character
    $representativePath = Join-Path $characterDir $representatives[$character]
    if (-not (Test-Path -LiteralPath $representativePath)) {
        $firstGenerated = Get-ChildItem -Path $characterDir -File | Select-Object -First 1
        $representativePath = if ($firstGenerated) { $firstGenerated.FullName } else { $sourceMap[$character] }
    }
    Copy-Item -LiteralPath $representativePath -Destination (Join-Path $assetRoot "$character.png") -Force
}

$filled = 0
foreach ($name in $allNames) {
    $character = Get-Character $name
    if (-not $character) { continue }

    $outputPath = Join-Path (Join-Path $generatedRoot $character) (Get-SafeName $name)
    if (-not (Test-Path -LiteralPath $outputPath)) {
        Copy-Item -LiteralPath (Join-Path $assetRoot "$character.png") -Destination $outputPath -Force
        $filled++
    }
}

Write-Host 'counts:'
$counts.GetEnumerator() | Sort-Object Name | ForEach-Object { Write-Host ("{0}: {1}" -f $_.Name, $_.Value) }
Write-Host ("failures: {0}" -f $failures.Count)
$failures | Select-Object -First 40 | ForEach-Object { Write-Host $_ }
Write-Host ("filled missing expected slots with representatives: {0}" -f $filled)
