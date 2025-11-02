# Remove Unused Backend Web App

## Why Remove It?

The "simplysoph-backend" web app in your Firebase Console is:
- Not being used (your `.env` uses a different app ID)
- Potentially confusing (named "backend" but it's a web client app)
- A security risk (unused credentials)

## Steps to Remove

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **simplysoph-66c78**
3. Click the **gear icon** ⚙️ next to "Project Overview"
4. Click **Project settings**
5. Scroll down to **Your apps** section
6. Find the **Web apps** section
7. Locate **simplysoph-backend** (App ID: `1:424903425639:web:4c4e9ed49ddc67f0bd9ec2`)
8. Click the **three dots menu** (⋮) on the right
9. Click **Delete app**
10. Confirm deletion

## What You're Keeping

Your active web app:
- **App ID**: `1:424903425639:web:4c4e9ed49ddc67f0bd9ec2`
- This is what's in your `.env` file as `VITE_FIREBASE_APP_ID`
- This is the one your site uses

## After Deletion

Nothing will break - the unused app has no impact on your live site. Your production app uses the credentials in your `.env` file and GitHub Secrets.

## If You Need Backend Later

For actual backend/server operations, you would use:
- **Firebase Admin SDK** (not a web app)
- **Service Account Key** (downloaded JSON file)
- **Cloud Functions** or your own server

Not another web app registration.
