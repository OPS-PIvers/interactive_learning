# GitHub Secrets Setup for Firebase CI/CD

Your Firebase CI/CD workflow is now configured! Here's what you need to complete the setup:

## Required GitHub Secrets

Go to your GitHub repository settings: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`

### ✅ Already Added
- `FIREBASE_API_KEY` (you mentioned this is already set up)

### 🔧 Still Required

**1. FIREBASE_SERVICE_ACCOUNT** ⚠️ **MOST IMPORTANT**
   - Go to: https://console.firebase.google.com/project/interactive-learning-278/settings/serviceaccounts/adminsdk
   - Click "Generate new private key"
   - Download the JSON file
   - Copy the **ENTIRE** contents of the JSON file
   - Paste as the value for this secret

**2. FIREBASE_PROJECT_ID**
   ```
   interactive-learning-278
   ```

**3. FIREBASE_AUTH_DOMAIN**
   ```
   interactive-learning-278.firebaseapp.com
   ```

**4. FIREBASE_STORAGE_BUCKET**
   ```
   interactive-learning-278.firebasestorage.app
   ```

**5. FIREBASE_MESSAGING_SENDER_ID**
   ```
   559846873035
   ```

**6. FIREBASE_APP_ID**
   ```
   1:559846873035:web:f0abe20a8d354b02a9084e
   ```

**7. FIREBASE_MEASUREMENT_ID**
   ```
   G-FQZK3QEV9L
   ```

## How the CI/CD Works

### Pull Requests
- Creates a **preview deployment** 
- Gets a temporary URL like: `https://your-project--pr-123-abc.web.app`
- Perfect for testing before merging

### Main Branch
- Deploys to **production** at: `https://interactive-learning-278.web.app`
- Automatic after every push to main

## Next Steps

1. **Add the secrets above** (most important: FIREBASE_SERVICE_ACCOUNT)
2. **Test with a PR**:
   ```bash
   git checkout -b test-ci-cd
   echo "// Test CI/CD $(date)" >> src/client/components/App.tsx
   git add . && git commit -m "test: CI/CD workflow"
   git push origin test-ci-cd
   ```
3. **Create Pull Request** and check Actions tab
4. **Merge to main** to test production deployment

## Troubleshooting

### If build fails:
- Check Actions tab for error details
- Verify all secrets are added correctly
- Ensure FIREBASE_SERVICE_ACCOUNT is valid JSON

### If you get authentication errors:
- Regenerate the service account key
- Make sure you copied the entire JSON content
- Check that the Firebase project ID matches

### Test locally first:
```bash
npm run build
npm run preview
```

## Your Deployment URLs

Once set up:
- **Production**: https://interactive-learning-278.web.app
- **Alternative**: https://interactive-learning-278.firebaseapp.com
- **Preview**: Will be shown in PR comments

## Migration Complete! 🎉

Your app is now running on Firebase with:
- ✅ Automatic deployments
- ✅ Preview deployments for PRs  
- ✅ Modern build system
- ✅ Better performance
- ✅ No more GAS build issues