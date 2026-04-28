Add-Type -AssemblyName System.Drawing
$imagePath = "C:\Users\Other_user\.gemini\antigravity\scratch\au-hardhat-practice\week-6-nft-minting\Jesus AK-47.tif"
$outputPath = "C:\Users\Other_user\.gemini\antigravity\scratch\au-hardhat-practice\week-6-nft-minting\Jesus_AK47_optimized.png"

$img = [System.Drawing.Image]::FromFile($imagePath)

# Calculate new dimensions (keeping aspect ratio)
$maxWidth = 1000
$scale = 1.0
if ($img.Width -gt $maxWidth) {
    $scale = $maxWidth / $img.Width
}

$newWidth = [int]($img.Width * $scale)
$newHeight = [int]($img.Height * $scale)

$bmp = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
$graph = [System.Drawing.Graphics]::FromImage($bmp)
$graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graph.DrawImage($img, 0, 0, $newWidth, $newHeight)

$bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$graph.Dispose()
$bmp.Dispose()
$img.Dispose()
