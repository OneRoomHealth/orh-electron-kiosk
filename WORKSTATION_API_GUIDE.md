# Workstation API Integration Guide

## Overview
The OneRoom Health Kiosk exposes a local HTTP API on `http://localhost:8787` that your workstation backend can call to control what displays on the kiosk screen.

---

## 🎯 Primary Endpoint: `/navigate`

**Use this endpoint to display any URL on the kiosk, regardless of user type.**

### Request Format

```http
POST http://localhost:8787/navigate
Content-Type: application/json

{
  "url": "https://your-full-url-here.com/path?params=values"
}
```

### Response Format

```json
{
  "success": true,
  "url": "https://your-full-url-here.com/path?params=values"
}
```

### Error Response

```json
{
  "error": "Missing url parameter"
}
```

---

## 📋 Example API Calls

### **Example 1: Show Carescape View**
```bash
curl -X POST http://localhost:8787/navigate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://fe-app.oneroomhealth.app/ledwallview/care?roomId=RM-001&inviteId=INV-123"}'
```

### **Example 2: Show In-Session View**
```bash
curl -X POST http://localhost:8787/navigate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://fe-app.oneroomhealth.app/ledwallview/ma?roomId=RM-001&inviteId=INV-456&inviteToken=abc123"}'
```

### **Example 3: Show Provider Extension View**
```bash
curl -X POST http://localhost:8787/navigate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://fe-app.oneroomhealth.app/extensionproviderview?roomId=RM-001"}'
```

### **Example 4: Return to Screensaver**
```bash
curl -X POST http://localhost:8787/screensaver
```

---

## 💻 Code Examples

### **Node.js / Express Backend**

```javascript
const axios = require('axios');

async function displayOnKiosk(url) {
  try {
    const response = await axios.post('http://localhost:8787/navigate', {
      url: url
    });
    console.log('Kiosk updated:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to update kiosk:', error.message);
    throw error;
  }
}

// Usage examples:
await displayOnKiosk('https://fe-app.oneroomhealth.app/ledwallview/care?roomId=123');
await displayOnKiosk('https://fe-app.oneroomhealth.app/ledwallview/ma?roomId=123&inviteId=456');
```

### **Python Backend**

```python
import requests
import json

def display_on_kiosk(url):
    try:
        response = requests.post(
            'http://localhost:8787/navigate',
            headers={'Content-Type': 'application/json'},
            data=json.dumps({'url': url})
        )
        response.raise_for_status()
        print(f"Kiosk updated: {response.json()}")
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Failed to update kiosk: {e}")
        raise

# Usage examples:
display_on_kiosk('https://fe-app.oneroomhealth.app/ledwallview/care?roomId=123')
display_on_kiosk('https://fe-app.oneroomhealth.app/ledwallview/ma?roomId=123&inviteId=456')
```

### **C# / .NET Backend**

```csharp
using System.Net.Http;
using System.Text;
using System.Text.Json;

public class KioskController
{
    private readonly HttpClient _httpClient;
    
    public KioskController()
    {
        _httpClient = new HttpClient();
    }
    
    public async Task<bool> DisplayOnKiosk(string url)
    {
        try
        {
            var payload = new { url = url };
            var content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            );
            
            var response = await _httpClient.PostAsync(
                "http://localhost:8787/navigate",
                content
            );
            
            response.EnsureSuccessStatusCode();
            Console.WriteLine($"Kiosk updated: {url}");
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to update kiosk: {ex.Message}");
            return false;
        }
    }
}

// Usage:
var controller = new KioskController();
await controller.DisplayOnKiosk("https://fe-app.oneroomhealth.app/ledwallview/care?roomId=123");
```

### **PowerShell (Testing)**

```powershell
# Display carescape
$body = @{
    url = "https://fe-app.oneroomhealth.app/ledwallview/care?roomId=123&inviteId=456"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8787/navigate" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

# Return to screensaver
Invoke-RestMethod -Uri "http://localhost:8787/screensaver" -Method POST
```

---

## 🔄 Typical Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  1. IDLE STATE                                              │
│  Kiosk shows: Screensaver (default on startup)             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  2. APPOINTMENT STARTS                                      │
│  Workstation API → POST /navigate                           │
│  Body: {"url": "https://.../ledwallview/care?roomId=123"}  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  3. PATIENT CHECKED IN                                      │
│  Workstation API → POST /navigate                           │
│  Body: {"url": "https://.../ledwallview/ma?roomId=123"}    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  4. APPOINTMENT ENDS                                        │
│  Workstation API → POST /navigate                           │
│  Body: {"url": "https://.../ledwallview/endAppt"}          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  5. RETURN TO IDLE                                          │
│  Workstation API → POST /screensaver                        │
│  (or wait for timeout if implemented)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 All Available Endpoints

| Endpoint | Method | Body | Description |
|----------|--------|------|-------------|
| `/navigate` | POST | `{"url": "..."}` | **Display any URL** (recommended) |
| `/screensaver` | POST | `{}` | Return to screensaver/idle |
| `/status` | POST | `{}` | Get current state info |
| `/carescape` | POST | `{"roomId": "123", ...}` | Shortcut for carescape state |
| `/in-session` | POST | `{"roomId": "123", ...}` | Shortcut for in-session state |
| `/goodbye` | POST | `{}` | Shortcut for goodbye state |
| `/state` | POST | `{"state": "carescape", "params": {...}}` | Generic state setter |

**Recommendation:** Use `/navigate` for maximum flexibility. It works regardless of user type and accepts any fully-formed URL.

---

## 🔐 Security Notes

- API is bound to `127.0.0.1` (localhost only)
- No authentication required (local machine trust)
- CORS enabled for local browser access
- Only POST requests accepted (except OPTIONS preflight)

---

## 🐛 Troubleshooting

### **Kiosk not responding to API calls**

1. Check if kiosk is running:
   ```powershell
   Get-Process | Where-Object {$_.ProcessName -like "*OneRoom*"}
   ```

2. Verify API server is listening:
   ```powershell
   Test-NetConnection -ComputerName localhost -Port 8787
   ```

3. Check kiosk logs (if running from source):
   ```bash
   npm start
   # Look for: "HTTP control server listening on http://127.0.0.1:8787"
   ```

### **API returns 404**

- Ensure you're using POST method, not GET
- Check the endpoint path is correct (e.g., `/navigate` not `/navigation`)

### **API returns 400 "Missing url parameter"**

- Verify JSON body includes `"url"` field
- Check Content-Type header is `application/json`

### **Kiosk shows blank screen after navigation**

- Verify the URL is accessible from the kiosk machine
- Check browser console in the kiosk (if running in dev mode)
- Ensure the URL doesn't require authentication the kiosk doesn't have

---

## 📝 Testing Script

Save this as `test-kiosk-api.ps1`:

```powershell
Write-Host "Testing OneRoom Health Kiosk API" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Test 1: Check status
Write-Host "`n1. Checking kiosk status..." -ForegroundColor Yellow
try {
    $status = Invoke-RestMethod -Uri "http://localhost:8787/status" -Method POST
    Write-Host "✓ Kiosk is running" -ForegroundColor Green
    Write-Host "  User Type: $($status.userType)" -ForegroundColor Gray
    Write-Host "  Current State: $($status.currentState)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Kiosk is not responding" -ForegroundColor Red
    exit 1
}

# Test 2: Navigate to carescape
Write-Host "`n2. Testing navigation to carescape..." -ForegroundColor Yellow
$carescapeUrl = "https://fe-app.oneroomhealth.app/ledwallview/care?roomId=TEST-123&inviteId=INV-456"
$body = @{ url = $carescapeUrl } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "http://localhost:8787/navigate" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✓ Navigated to carescape" -ForegroundColor Green
    Start-Sleep -Seconds 3
} catch {
    Write-Host "✗ Navigation failed: $_" -ForegroundColor Red
}

# Test 3: Navigate to in-session
Write-Host "`n3. Testing navigation to in-session..." -ForegroundColor Yellow
$inSessionUrl = "https://fe-app.oneroomhealth.app/ledwallview/ma?roomId=TEST-123&inviteId=INV-456"
$body = @{ url = $inSessionUrl } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "http://localhost:8787/navigate" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✓ Navigated to in-session" -ForegroundColor Green
    Start-Sleep -Seconds 3
} catch {
    Write-Host "✗ Navigation failed: $_" -ForegroundColor Red
}

# Test 4: Return to screensaver
Write-Host "`n4. Returning to screensaver..." -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "http://localhost:8787/screensaver" -Method POST
    Write-Host "✓ Returned to screensaver" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to return to screensaver: $_" -ForegroundColor Red
}

Write-Host "`n✓ All tests completed!" -ForegroundColor Green
```

Run with: `pwsh test-kiosk-api.ps1`

---

## 🎯 Summary for Your Workstation API

**To display content on the kiosk:**

```javascript
// Your workstation API should make this call:
POST http://localhost:8787/navigate
Content-Type: application/json

{
  "url": "https://your-complete-url.com/path?with=all&query=params"
}
```

**Key Points:**
- ✅ Works for both Provider and LED CareWall user types
- ✅ Accepts any fully-formed URL
- ✅ URL should include all query parameters you need
- ✅ Kiosk will display exactly what you send
- ✅ Default state on startup is screensaver URL
- ✅ Call `/screensaver` endpoint to return to idle state

**Your workstation API is responsible for:**
- Building the complete URL with all necessary parameters
- Knowing when to transition between states
- Calling the kiosk API at the right times
- Handling appointment lifecycle (start → in-session → end → idle)

