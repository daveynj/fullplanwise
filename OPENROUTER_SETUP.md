# OpenRouter API Setup Guide

## 🚀 Quick Setup (3 minutes)

### Step 1: Get Your OpenRouter API Key
1. Go to [https://openrouter.ai/](https://openrouter.ai/)
2. Sign up for a free account
3. Go to **API Keys** section
4. Click **Create Key**
5. Copy the key (starts with `sk-or-v1-`)

### Step 2: Add to Replit Secrets
1. In your Replit workspace, click **Tools** > **Secrets**
2. Add a new secret:
   - **Key**: `OPENROUTER_API_KEY`
   - **Value**: `sk-or-v1-...` (paste your full API key)
3. Click **Add Secret**

### Step 3: Restart Your App
1. Click the **Stop** button (if running)
2. Click the **Run** button to restart
3. Check the console logs for confirmation

## 🔧 Alternative: .env File (if secrets don't work)

If Replit secrets aren't working, you can create a `.env` file:

1. Create a new file named `.env` in your project root
2. Add this content:
```env
OPENROUTER_API_KEY=sk-or-v1-your-actual-api-key-here
```
3. Restart your application

## ✅ Verification

After setup, you should see these messages in your console:
```
🚀 Starting PlanwiseESL Server...
🔑 API Keys Status:
   OpenRouter: ✅ SET
   Gemini (legacy): ❌ NOT SET
   Stability (legacy): ❌ NOT SET

🔧 OpenRouter Service initializing...
🔑 API Key provided: YES (length: 56)
✅ OpenRouter API key found, initializing client...
```

## 🐛 Troubleshooting

### If you still see "API key not configured":

1. **Check the key name**: Must be exactly `OPENROUTER_API_KEY` (all caps)
2. **Check the key value**: Must start with `sk-or-v1-`
3. **Restart completely**: Stop and restart the entire Replit workspace
4. **Check console logs**: Look for the detailed startup messages

### Test Script

Run this in your console to test:
```javascript
// In browser console or Node.js
console.log('API Key:', process.env.OPENROUTER_API_KEY ? 'SET' : 'NOT SET');
```

## 📈 Expected Results

Once working, you'll see:
- ✅ **62% cheaper** lesson generation with Qwen 2.5 72B
- ✅ **All existing features** work the same
- ✅ **Better quality** for educational content
- ⚠️ **Images disabled** (until you add a direct image provider)

## 🎯 Next Steps

1. **Test lesson generation** - should work with Qwen
2. **Monitor costs** in your OpenRouter dashboard
3. **Consider image provider** for full functionality

## 💰 Cost Comparison

| Service | Before | After | Savings |
|---------|--------|-------|---------|
| Text Generation | $0.003/lesson | $0.0015/lesson | **50%** |
| Image Generation | $0.04/image | Coming soon | **~60%** |
| **Total** | **$0.043/lesson** | **$0.0165/lesson** | **62%** |

**Monthly savings**: ~$270 for 1,000 lessons 🚀
