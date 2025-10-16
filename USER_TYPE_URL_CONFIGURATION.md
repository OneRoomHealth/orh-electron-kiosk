# User Type URL Configuration

## Overview

The OneRoom Health Kiosk now supports user-type-specific URLs. Different states and URLs are used based on whether the installation is configured as a **Provider Workstation** or **LED CareWall Display**.

> **📝 Updated**: October 16, 2025 - Documentation updated to reflect current configuration using remote URLs for screensavers and removal of unused `LED_WALL_BASE_URL` variable.

## Implementation Date

October 16, 2025

## User Types

### 1. LED CareWall Display (`USER_TYPE=ledcarewall`)

**Purpose**: Waiting room displays showing patient information

**States**: 4 states available
1. **Screensaver** - Remote URL display (exact URL, no params)
2. **Carescape** - Pre-session display (params appended)
3. **In-Session** - Active appointment (params appended)
4. **Goodbye** - Post-appointment screen (params appended)

**URLs**:
```bash
SCREENSAVER_URL=https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/wall/default  # Exact URL, no params
CARESCAPE_URL=https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/ledwallview/care  # Params appended
IN_SESSION_URL=https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/ledwallview/ma  # Params appended
GOODBYE_URL=https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/ledwallview/endAppt  # Params appended
```

### 2. Provider Workstation (`USER_TYPE=provider`)

**Purpose**: Healthcare provider computers

**States**: 2 states only
1. **Screensaver** - Provider idle display (exact URL, no params)
2. **In-Session** - Active appointment view (params appended)

**URLs**:
```bash
PROVIDER_SCREENSAVER_URL=https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/wall/default  # Exact URL
PROVIDER_IN_SESSION_URL=https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/extensionproviderview  # Params appended
```

## URL Parameter Handling

### Exact URLs (No Parameters)

These URLs are used as-is, no query parameters are appended:

- **LED CareWall screensaver**: `https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/wall/default`
- **Provider screensaver**: `https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/wall/default`

**Note**: Both user types now use the same screensaver URL. If you need different screensaver URLs, set different values for `SCREENSAVER_URL` and `PROVIDER_SCREENSAVER_URL`.

### URLs with Parameters

These URLs have query parameters appended:

**LED CareWall**:
- Carescape: `?roomId=xxx&inviteId=xxx`
- In-Session: `?roomId=xxx&inviteId=xxx&inviteToken=xxx`
- Goodbye: Optional params

**Provider**:
- In-Session: `?roomId=xxx&inviteId=xxx&inviteToken=xxx`

## Configuration

### Environment Variables

**For LED CareWall (`.env`):**
```bash
USER_TYPE=ledcarewall

# Exact URL (no params)
SCREENSAVER_URL=https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/wall/default

# URLs with params appended
CARESCAPE_URL=https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/ledwallview/care
IN_SESSION_URL=https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/ledwallview/ma
GOODBYE_URL=https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/ledwallview/endAppt
```

**For Provider Workstation (`.env`):**
```bash
USER_TYPE=provider

# Exact URL (no params)
PROVIDER_SCREENSAVER_URL=https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/wall/default

# URL with params appended
PROVIDER_IN_SESSION_URL=https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/extensionproviderview
```

## Implementation Details

### State URL Selection

The code automatically selects URLs based on `USER_TYPE`:

```javascript
const STATE_URLS = USER_TYPE === 'provider' ? {
  screensaver: process.env.PROVIDER_SCREENSAVER_URL,
  inSession: process.env.PROVIDER_IN_SESSION_URL,
} : {
  screensaver: process.env.SCREENSAVER_URL,
  carescape: process.env.CARESCAPE_URL,
  inSession: process.env.IN_SESSION_URL,
  goodbye: process.env.GOODBYE_URL,
};
```

### Parameter Appending Logic

```javascript
// States that use exact URLs (no params appended)
const EXACT_URL_STATES = {
  'provider': ['screensaver'],
  'ledcarewall': ['screensaver']
};

// In setState() function:
const exactUrlStates = EXACT_URL_STATES[USER_TYPE] || [];
const useExactUrl = exactUrlStates.includes(state);
const url = useExactUrl ? stateUrl : buildUrlWithParams(stateUrl, params);
```

## API Usage Examples

### LED CareWall Display

```bash
# Screensaver (exact URL)
curl -X POST http://localhost:8787/screensaver

# Carescape (with params)
curl -X POST http://localhost:8787/carescape \
  -H "Content-Type: application/json" \
  -d '{"roomId":"room-123","inviteId":"invite-456"}'
# Result: https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/ledwallview/care?roomId=room-123&inviteId=invite-456

# In-Session (with params)
curl -X POST http://localhost:8787/in-session \
  -H "Content-Type: application/json" \
  -d '{"roomId":"room-123","inviteId":"invite-456","inviteToken":"token-xyz"}'
# Result: https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/ledwallview/ma?roomId=room-123&inviteId=invite-456&inviteToken=token-xyz

# Goodbye
curl -X POST http://localhost:8787/goodbye
# Result: https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/ledwallview/endAppt
```

### Provider Workstation

```bash
# Screensaver (exact URL, no params)
curl -X POST http://localhost:8787/screensaver
# Result: https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/wall/default (exact)

# In-Session (with params)
curl -X POST http://localhost:8787/in-session \
  -H "Content-Type: application/json" \
  -d '{"roomId":"room-123","inviteId":"invite-456"}'
# Result: https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/extensionproviderview?roomId=room-123&inviteId=invite-456

# Carescape NOT available for provider
curl -X POST http://localhost:8787/carescape
# Result: Error - unknown state
```

## Testing

Use the provided test script:

```powershell
# Test current user type configuration
pwsh test-user-types.ps1
```

Or manually verify:

```bash
# Check current configuration
curl -X POST http://localhost:8787/status

# Response shows:
{
  "userType": "provider",  # or "ledcarewall"
  "availableStates": ["screensaver", "inSession"],  # or 4 states for ledcarewall
  ...
}
```

## State Availability by User Type

| State | LED CareWall | Provider | Params Appended |
|-------|--------------|----------|-----------------|
| screensaver | ✅ (URL) | ✅ (URL) | ❌ (exact URLs) |
| carescape | ✅ | ❌ | ✅ |
| inSession | ✅ | ✅ | ✅ |
| goodbye | ✅ | ❌ | ✅ (optional) |

## URL Examples

### LED CareWall Display

**Screensaver** (exact URL):
- URL: `https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/wall/default`
- Params: Ignored
- Result: `https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/wall/default` (exact)

**Carescape with roomId**:
- Base: `https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/ledwallview/care`
- Params: `{roomId: "room-123"}`
- Result: `https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/ledwallview/care?roomId=room-123`

**In-Session with full params**:
- Base: `https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/ledwallview/ma`
- Params: `{roomId: "room-123", inviteId: "invite-456", inviteToken: "token-xyz"}`
- Result: `https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/ledwallview/ma?roomId=room-123&inviteId=invite-456&inviteToken=token-xyz`

### Provider Workstation

**Screensaver** (exact URL):
- URL: `https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/wall/default`
- Params: Ignored
- Result: `https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/wall/default` (exact)

**In-Session with params**:
- Base: `https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/extensionproviderview`
- Params: `{roomId: "room-123", inviteId: "invite-456"}`
- Result: `https://orh-frontend-dev-container.politebeach-927fe169.westus2.azurecontainerapps.io/extensionproviderview?roomId=room-123&inviteId=invite-456`

## Troubleshooting

### Wrong URLs Being Used

1. Check user type:
   ```bash
   curl -X POST http://localhost:8787/status
   ```

2. Verify `.env` file has correct `USER_TYPE`

3. Check correct URL variables are set:
   - LED CareWall: `SCREENSAVER_URL`, `CARESCAPE_URL`, etc.
   - Provider: `PROVIDER_SCREENSAVER_URL`, `PROVIDER_IN_SESSION_URL`

### State Not Available

Provider workstations only have 2 states. Attempting to access `carescape` or `goodbye` will fail with "Unknown state" error.

### Parameters Not Appearing

1. Check if state is in `EXACT_URL_STATES` (screensavers use exact URLs)
2. Verify params are being sent in request body
3. Check console logs for "with params" vs "exact URL" message

### Local Splash Screen vs Remote URL

If you want to use the local splash screen instead of a remote URL, set:
```bash
SCREENSAVER_URL=splash
```

This will load the local `electron/renderer/splash.html` file instead of a remote URL.

## Status

✅ **Fully Implemented**
- User-type-based URL selection
- Exact URL vs parametrized URL handling
- Provider 2-state system
- LED CareWall 4-state system
- Documentation complete
- Test script available

---

**Version**: 1.0.9  
**Implementation**: User-type-specific URL configuration

