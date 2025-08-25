# OpenRouter Migration for PlanwiseESL

## Overview

PlanwiseESL has been successfully migrated from using the Google Gemini SDK directly to using **Google Gemini 2.0 Flash via OpenRouter**. This provides better flexibility, unified API access, and potential cost benefits.

## What Changed

### 1. **Gemini Service Updates** (`server/services/gemini.ts`)
- ✅ Replaced Google Generative AI SDK with axios HTTP requests to OpenRouter
- ✅ Updated model names:
  - Main lesson generation: `gemini-2.0-flash-exp` → `google/gemini-2.0-flash-001`
  - Sentence validation: `gemini-1.5-flash` → `google/gemini-1.5-flash`
- ✅ Added proper OpenRouter headers and authentication
- ✅ Maintained all existing functionality and error handling

### 2. **Environment Variables**
- ✅ Changed from `GEMINI_API_KEY` to `OPENROUTER_API_KEY`
- ✅ Added test connection function for validation

### 3. **API Integration**
- ✅ Added `/api/test-openrouter` endpoint for testing connection (admin only)
- ✅ Maintained existing lesson generation and validation workflows
- ✅ Preserved all existing features and functionality

## Setup Instructions

### 1. Get OpenRouter API Key
1. Visit [OpenRouter.ai](https://openrouter.ai)
2. Create an account and get your API key
3. Ensure you have credits/billing set up

### 2. Update Environment Variables
Add this to your `.env` file:

```env
# Replace the old GEMINI_API_KEY with:
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 3. Test the Integration
Once you've set the API key, test the connection:

**Option A: Via API endpoint (admin only)**
```
GET /api/test-openrouter
```

**Option B: Via test script**
```bash
# From project root
node test-openrouter.js
```

## Model Configuration

### Primary Model (Lesson Generation)
- **Model**: `google/gemini-2.0-flash-001`
- **Temperature**: 0.3
- **Max Tokens**: 16,384
- **Purpose**: Generate complete ESL lessons with all components

### Secondary Model (Quality Validation)
- **Model**: `google/gemini-1.5-flash`
- **Temperature**: 0.1
- **Max Tokens**: 2,000
- **Purpose**: Validate and correct sentence frame examples

## Benefits of OpenRouter

1. **Unified API**: Single endpoint for multiple AI models
2. **Cost Optimization**: Potentially better pricing through OpenRouter
3. **Flexibility**: Easy to switch models or providers if needed
4. **Rate Limiting**: Built-in request management
5. **Analytics**: Better usage tracking and monitoring

## Testing Checklist

- [ ] Set `OPENROUTER_API_KEY` in environment
- [ ] Run connection test via `/api/test-openrouter`
- [ ] Generate a test lesson through the UI
- [ ] Verify lesson content and quality
- [ ] Check sentence frame validation works correctly

## Rollback Plan

If you need to revert to the Google SDK:

1. Restore from backup: `server/services/gemini.ts.backup`
2. Change back to `GEMINI_API_KEY` in environment
3. Update the service instantiation in routes.ts

## Support

For OpenRouter-specific issues:
- OpenRouter Documentation: https://openrouter.ai/docs
- OpenRouter Support: https://openrouter.ai/contact

For PlanwiseESL-specific issues:
- Check the application logs
- Test with the `/api/test-openrouter` endpoint
- Verify API key has sufficient credits
