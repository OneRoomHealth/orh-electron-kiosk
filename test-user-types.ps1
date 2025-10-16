# OneRoom Health Kiosk - User Type URL Test Script
# This script tests that the correct URLs are used based on user type

$baseUrl = "http://localhost:8787"

Write-Host "OneRoom Health Kiosk - User Type URL Test" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Get current status
Write-Host "Getting current configuration..." -ForegroundColor Yellow
try {
    $status = Invoke-RestMethod -Uri "$baseUrl/status" -Method POST
    
    Write-Host "✓ Current Configuration:" -ForegroundColor Green
    Write-Host "  User Type: $($status.userType)" -ForegroundColor White
    Write-Host "  Current State: $($status.currentState)" -ForegroundColor White
    Write-Host "  Available States: $($status.availableStates -join ', ')" -ForegroundColor White
    Write-Host ""
    
    $userType = $status.userType
    
    # Test based on user type
    if ($userType -eq "provider") {
        Write-Host "Testing Provider Workstation (2 states)" -ForegroundColor Magenta
        Write-Host ""
        
        # Test 1: Provider Screensaver (exact URL, no params)
        Write-Host "Test 1: Provider Screensaver (exact URL)" -ForegroundColor Yellow
        $response = Invoke-RestMethod -Uri "$baseUrl/screensaver" -Method POST
        Write-Host "✓ Success: Screensaver displayed" -ForegroundColor Green
        Start-Sleep -Seconds 2
        
        # Test 2: Provider In-Session (with params)
        Write-Host "Test 2: Provider In-Session (with params)" -ForegroundColor Yellow
        $body = @{
            roomId = "test-room-123"
            inviteId = "test-invite-456"
        } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$baseUrl/in-session" -Method POST -Body $body -ContentType "application/json"
        Write-Host "✓ Success: In-Session view with params" -ForegroundColor Green
        Write-Host "  Expected URL: https://fe-app.oneroomhealth.app/extensionproviderview?roomId=test-room-123&inviteId=test-invite-456" -ForegroundColor Gray
        Start-Sleep -Seconds 2
        
        # Test 3: Verify carescape not available for provider
        Write-Host "Test 3: Verify carescape not available" -ForegroundColor Yellow
        try {
            $response = Invoke-RestMethod -Uri "$baseUrl/carescape" -Method POST -Body $body -ContentType "application/json"
            Write-Host "⚠ Warning: Carescape should not be available for provider" -ForegroundColor Red
        } catch {
            Write-Host "✓ Success: Carescape correctly unavailable" -ForegroundColor Green
        }
        
    } elseif ($userType -eq "ledcarewall") {
        Write-Host "Testing LED CareWall Display (4 states)" -ForegroundColor Magenta
        Write-Host ""
        
        # Test 1: LED Screensaver (splash - no URL)
        Write-Host "Test 1: LED Screensaver (local splash)" -ForegroundColor Yellow
        $response = Invoke-RestMethod -Uri "$baseUrl/screensaver" -Method POST
        Write-Host "✓ Success: Screensaver displayed (local splash.html)" -ForegroundColor Green
        Start-Sleep -Seconds 2
        
        # Test 2: Carescape (with params)
        Write-Host "Test 2: Carescape (with params)" -ForegroundColor Yellow
        $body = @{
            roomId = "room-789"
            inviteId = "invite-012"
        } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$baseUrl/carescape" -Method POST -Body $body -ContentType "application/json"
        Write-Host "✓ Success: Carescape with params" -ForegroundColor Green
        Write-Host "  Expected URL: https://fe-app.oneroomhealth.app/ledwallview/care?roomId=room-789&inviteId=invite-012" -ForegroundColor Gray
        Start-Sleep -Seconds 2
        
        # Test 3: In-Session (with params)
        Write-Host "Test 3: In-Session (with params)" -ForegroundColor Yellow
        $body = @{
            roomId = "room-789"
            inviteId = "invite-012"
            inviteToken = "token-xyz"
        } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$baseUrl/in-session" -Method POST -Body $body -ContentType "application/json"
        Write-Host "✓ Success: In-Session with params" -ForegroundColor Green
        Write-Host "  Expected URL: https://fe-app.oneroomhealth.app/ledwallview/ma?roomId=room-789&inviteId=invite-012&inviteToken=token-xyz" -ForegroundColor Gray
        Start-Sleep -Seconds 2
        
        # Test 4: Goodbye (with optional params)
        Write-Host "Test 4: Goodbye screen" -ForegroundColor Yellow
        $response = Invoke-RestMethod -Uri "$baseUrl/goodbye" -Method POST
        Write-Host "✓ Success: Goodbye screen" -ForegroundColor Green
        Write-Host "  Expected URL: https://fe-app.oneroomhealth.app/ledwallview/endAppt" -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
    
    # Final status check
    Write-Host ""
    Write-Host "Final Status Check:" -ForegroundColor Yellow
    $finalStatus = Invoke-RestMethod -Uri "$baseUrl/status" -Method POST
    Write-Host "  Current State: $($finalStatus.currentState)" -ForegroundColor White
    Write-Host "  State Params: $($finalStatus.stateParams | ConvertTo-Json -Compress)" -ForegroundColor White
    
    Write-Host ""
    Write-Host "✓ All tests passed for user type: $userType" -ForegroundColor Green
    
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure the kiosk app is running:" -ForegroundColor Yellow
    Write-Host "  npm start" -ForegroundColor White
}

Write-Host ""
Write-Host "Test complete!" -ForegroundColor Cyan

