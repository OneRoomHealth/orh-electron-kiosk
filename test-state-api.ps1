# OneRoom Health Kiosk - State API Test Script
# This script demonstrates how to control the kiosk via HTTP API

$baseUrl = "http://localhost:8787"

Write-Host "OneRoom Health Kiosk - State Management Test" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Function to make API calls
function Invoke-KioskAPI {
    param(
        [string]$Endpoint,
        [hashtable]$Body = $null
    )
    
    $url = "$baseUrl$Endpoint"
    Write-Host "Calling: POST $url" -ForegroundColor Yellow
    
    try {
        if ($Body) {
            $jsonBody = $Body | ConvertTo-Json
            Write-Host "Body: $jsonBody" -ForegroundColor Gray
            $response = Invoke-RestMethod -Uri $url -Method POST -Body $jsonBody -ContentType "application/json"
        } else {
            $response = Invoke-RestMethod -Uri $url -Method POST
        }
        
        Write-Host "✓ Success" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 5
        Write-Host ""
        return $response
    }
    catch {
        Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        return $null
    }
}

# Test 1: Get current status
Write-Host "Test 1: Get Current Status" -ForegroundColor Magenta
Invoke-KioskAPI -Endpoint "/status"
Start-Sleep -Seconds 2

# Test 2: Show screensaver
Write-Host "Test 2: Show Screensaver" -ForegroundColor Magenta
Invoke-KioskAPI -Endpoint "/screensaver"
Start-Sleep -Seconds 3

# Test 3: Show carescape with parameters
Write-Host "Test 3: Show Carescape" -ForegroundColor Magenta
Invoke-KioskAPI -Endpoint "/carescape" -Body @{
    roomId = "room-123"
    inviteId = "invite-456"
}
Start-Sleep -Seconds 3

# Test 4: Transition to in-session
Write-Host "Test 4: Show In-Session View" -ForegroundColor Magenta
Invoke-KioskAPI -Endpoint "/in-session" -Body @{
    roomId = "room-123"
    inviteId = "invite-456"
    inviteToken = "test-token-xyz"
}
Start-Sleep -Seconds 3

# Test 5: Show goodbye screen
Write-Host "Test 5: Show Goodbye Screen" -ForegroundColor Magenta
Invoke-KioskAPI -Endpoint "/goodbye"
Start-Sleep -Seconds 3

# Test 6: Generic state API
Write-Host "Test 6: Use Generic State API (back to carescape)" -ForegroundColor Magenta
Invoke-KioskAPI -Endpoint "/state" -Body @{
    state = "carescape"
    params = @{
        roomId = "room-999"
    }
}
Start-Sleep -Seconds 2

# Test 7: Check final status
Write-Host "Test 7: Final Status Check" -ForegroundColor Magenta
Invoke-KioskAPI -Endpoint "/status"

Write-Host "Test complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to return to screensaver..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Invoke-KioskAPI -Endpoint "/screensaver"
Write-Host "Done!" -ForegroundColor Green

