# AppSignal Setup Guide

## Overview
AppSignal monitoring has been successfully integrated into your Interactive Learning Hub application for error tracking and performance monitoring.

## Setup Steps Completed

### 1. Installation
- ✅ Installed `@appsignal/javascript` package
- ✅ Created AppSignal configuration in `src/lib/appsignal.ts`
- ✅ Added environment variable placeholder in `.env`

### 2. Error Tracking
- ✅ Enhanced `ErrorBoundary` component to send React errors to AppSignal
- ✅ Enhanced `InteractiveModule` error logging to include AppSignal reporting
- ✅ Created `useAppSignal` hook for easy error reporting throughout the app

### 3. Performance Monitoring
- ✅ Added span tracking for hotspot interactions
- ✅ Added breadcrumb tracking for user actions
- ✅ Performance monitoring for key user interactions

## Configuration Required

### Environment Variables
Add your AppSignal Push API Key to your environment variables:

```bash
# In .env file
VITE_APPSIGNAL_PUSH_API_KEY=your_actual_appsignal_push_api_key_here
```

### Getting Your API Key
1. Sign up for AppSignal at https://appsignal.com
2. Create a new application in your AppSignal dashboard
3. Copy the Push API Key from your app settings
4. Replace `your_appsignal_push_api_key_here` in your `.env` file

## Files Modified/Created

### New Files
- `src/lib/appsignal.ts` - AppSignal configuration
- `src/client/hooks/useAppSignal.ts` - React hook for AppSignal integration

### Modified Files
- `src/client/components/ErrorBoundary.tsx` - Enhanced with AppSignal error reporting
- `src/client/components/InteractiveModule.tsx` - Added error reporting and performance monitoring
- `src/client/index.tsx` - Added AppSignal import
- `.env` - Added AppSignal environment variable

## Usage

### Error Reporting
Errors are automatically reported through:
- React Error Boundary for unhandled React errors
- Enhanced error logging in InteractiveModule
- Manual error reporting using the `useAppSignal` hook

### Performance Monitoring
Performance is automatically tracked for:
- Hotspot focus interactions
- User navigation actions
- Component lifecycle events

### Manual Usage
Use the `useAppSignal` hook for custom tracking:

```typescript
import { useAppSignal } from '../hooks/useAppSignal';

const MyComponent = () => {
  const { reportError, addBreadcrumb, createSpan } = useAppSignal();

  const handleAction = () => {
    try {
      addBreadcrumb('user_action', 'Button clicked');
      // Your action code
    } catch (error) {
      reportError(error, { component: 'MyComponent', action: 'handleAction' });
    }
  };
};
```

## Features Included

1. **Error Tracking**: Automatic capture of JavaScript errors and React component errors
2. **Performance Monitoring**: Track user interactions and component performance
3. **Breadcrumbs**: Audit trail of user actions leading to errors
4. **Custom Tags**: Rich context with error reports including component, mode, and project info
5. **User Context**: Optional user identification for error tracking

## Testing

Build verification completed successfully. AppSignal will start collecting data once:
1. You add your API key to the environment variables
2. Deploy or run the application with the API key configured

## Next Steps

1. Add your AppSignal Push API Key to the `.env` file
2. Test the integration by triggering an error (can be done in development)
3. Check your AppSignal dashboard for incoming data
4. Configure alert rules in AppSignal for critical errors
5. Set up performance monitoring thresholds