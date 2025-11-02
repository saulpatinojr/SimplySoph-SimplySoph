# How to Get Your Firebase UID

## Method 1: From Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **simplysoph-66c78**
3. Click **Authentication** in the left sidebar
4. Click **Users** tab
5. Sign in to your app at least once (visit https://simplysoph-66c78.web.app/login)
6. Your user will appear in the list - copy the **User UID** column
7. Paste it in `.env`:
   ```
   VITE_OWNER_FIREBASE_UID=paste-your-uid-here
   ```

## Method 2: From Browser Console

1. Visit https://simplysoph-66c78.web.app/login
2. Sign in with your account
3. Open browser DevTools (F12)
4. Go to **Console** tab
5. Type: `localStorage.getItem('firebase:authUser:AIzaSyDd6sT_P3nBVG5OfDX8IbhlszKyM9T9n0E:[DEFAULT]')`
6. Press Enter
7. Look for `"uid":"YOUR_UID_HERE"` in the output
8. Copy the UID value

## Method 3: Add to Admin Page (Temporary)

I can add a "Show My UID" button to the admin dashboard that displays it after login.

## After Setting UID

1. Update `.env` file locally
2. Add to GitHub Secrets:
   - Go to GitHub repo → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `VITE_OWNER_FIREBASE_UID`
   - Value: Your UID
   - Click "Add secret"

3. Update both workflow files to include the new secret (I'll do this for you)

4. Redeploy the app

## What This Does

Setting `VITE_OWNER_FIREBASE_UID` makes you the admin:
- Grants access to `/admin` routes
- Allows creating/editing/deleting blog posts
- Enables video and photo uploads
- Creates admin document in Firestore automatically
