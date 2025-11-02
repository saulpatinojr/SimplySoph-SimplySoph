# Setup Checklist - Critical Tasks

## ✅ Task 1: Storage Rules (COMPLETED)
- [x] Created `storage.rules` file
- [x] Added storage config to `firebase.json`
- [ ] Deploy rules: Run `firebase deploy --only storage`

## 🔄 Task 2: Get Your Firebase UID (IN PROGRESS)

### Step 1: Sign in and get UID
- [ ] Visit https://simplysoph-66c78.web.app/login
- [ ] Sign in with your account
- [ ] Go to Firebase Console → Authentication → Users
- [ ] Copy your User UID

### Step 2: Update local .env
- [ ] Open `.env` file
- [ ] Set `VITE_OWNER_FIREBASE_UID=your-uid-here`
- [ ] Save file

### Step 3: Add to GitHub Secrets
- [ ] Go to GitHub repo → Settings → Secrets and variables → Actions
- [ ] Click "New repository secret"
- [ ] Name: `VITE_OWNER_FIREBASE_UID`
- [ ] Value: Your UID
- [ ] Click "Add secret"

### Step 4: Redeploy
- [ ] Commit changes: `git add . && git commit -m "Add storage rules and owner UID"`
- [ ] Push: `git push`
- [ ] Wait for GitHub Actions to deploy

## 🗑️ Task 3: Remove Unused Backend App (TODO)

- [ ] Go to Firebase Console → Project Settings
- [ ] Scroll to "Your apps" → "Web apps"
- [ ] Find "simplysoph-backend"
- [ ] Click three dots (⋮) → Delete app
- [ ] Confirm deletion

## 📝 Reference Files Created

- `storage.rules` - Secure upload rules
- `GET_UID.md` - Instructions for getting your Firebase UID
- `REMOVE_BACKEND_APP.md` - Guide for removing unused app
- `SETUP_CHECKLIST.md` - This file

## 🚀 After Completion

Once all tasks are done:
1. Your admin access will work properly
2. Image/video uploads will be secure
3. Firebase Console will be clean
4. Ready to tackle next priorities from ROADMAP.md

## Need Help?

- Can't find your UID? See `GET_UID.md`
- Confused about backend app? See `REMOVE_BACKEND_APP.md`
- Want to deploy storage rules? Run: `firebase deploy --only storage`
