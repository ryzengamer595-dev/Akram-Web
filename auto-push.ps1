$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "        AKRAM_WEB AUTO PUSH" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Watching for changes..." -ForegroundColor Green
Write-Host "Save with Ctrl + S and GitHub will update automatically." -ForegroundColor Yellow
Write-Host "Press Ctrl + C to stop." -ForegroundColor Red
Write-Host ""

while ($true) {

    $changes = git status --porcelain

    if (-not [string]::IsNullOrWhiteSpace($changes)) {

        Write-Host ""
        Write-Host "Change detected!" -ForegroundColor Cyan

        git add .

        $message = "Update website $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

        git commit -m $message

        if ($LASTEXITCODE -eq 0) {

            git push

            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "========================================" -ForegroundColor Green
                Write-Host "     GITHUB UPDATE SUCCESSFUL" -ForegroundColor Green
                Write-Host "========================================" -ForegroundColor Green
                Write-Host ""
            }
            else {
                Write-Host "GitHub push failed." -ForegroundColor Red
            }
        }
    }

    Start-Sleep -Seconds 2
}