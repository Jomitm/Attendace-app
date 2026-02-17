$port = 3004
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:${port}/")

try {
    $listener.Start()
}
catch {
    Write-Host "Port 3004 is busy. Trying 8080..."
    $port = 8080
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:${port}/")
    $listener.Start()
}

Write-Host "Test server started at http://localhost:${port}/"
Write-Host "Press Ctrl+C to stop."

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $localPath = $request.Url.LocalPath.Replace('/', '\\').TrimStart('\\')
        if ($localPath.Contains("..")) {
            $response.StatusCode = 403
            $response.Close()
            continue
        }

        $path = Join-Path $PWD $localPath

        if (Test-Path $path -PathType Container) {
            $path = Join-Path $path "index.html"
        }

        if (Test-Path $path -PathType Leaf) {
            $content = [System.IO.File]::ReadAllBytes($path)
            $response.ContentLength64 = $content.Length

            if ($path.EndsWith(".html")) { $response.ContentType = "text/html" }
            elseif ($path.EndsWith(".js")) { $response.ContentType = "application/javascript" }
            elseif ($path.EndsWith(".css")) { $response.ContentType = "text/css" }
            elseif ($path.EndsWith(".png")) { $response.ContentType = "image/png" }
            elseif ($path.EndsWith(".jpg")) { $response.ContentType = "image/jpeg" }
            elseif ($path.EndsWith(".svg")) { $response.ContentType = "image/svg+xml" }

            $response.OutputStream.Write($content, 0, $content.Length)
        }
        else {
            $response.StatusCode = 404
        }

        $response.Close()
    }
    catch {
        Write-Host "Error: $_"
    }
}
