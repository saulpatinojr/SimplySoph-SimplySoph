# Deployment Guide

## Prerequisites

Before deploying SimplySoph, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- Firebase CLI installed globally (`npm install -g firebase-tools`)
- Firebase project created at https://console.firebase.google.com/
- GitHub repository (optional, for CI/CD)

## Firebase Project Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `simplysoph` (or your preferred name)
4. Enable Google Analytics (recommended)
5. Choose Google Analytics account

### 2. Enable Required Services
In your Firebase project:

1. **Firestore Database**:
   - Go to Firestore Database → Create database
   - Choose "Start in test mode" (configure security rules later)
   - Select location (choose closest to your users)

2. **Authentication**:
   - Go to Authentication → Get started
   - Enable Google sign-in provider
   - Add authorized domains (localhost, your domain)

3. **Storage**:
   - Go to Storage → Get started
   - Choose "Start in test mode" (configure security rules later)

4. **Hosting**:
   - Go to Hosting → Get started
   - Follow setup wizard (domain configuration optional)

### 3. Get Firebase Configuration
1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click "Add app" → Web app (</>)
4. Register app with name "SimplySoph Web"
5. Copy the Firebase config object

## Local Development Setup

### 1. Clone Repository
```bash
git clone <your-repository-url>
cd simplysoph
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` with your Firebase configuration:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Admin Configuration
VITE_OWNER_FIREBASE_UID=your-admin-uid-here

# App Configuration
VITE_APP_TITLE=SimplySoph
VITE_APP_LOGO=/logo.png
```

### 4. Get Admin UID
1. Start the development server: `npm run dev`
2. Open http://localhost:5173
3. Click "Login" and authenticate with Google
4. After login, check browser console or Firebase Auth console
5. Copy your Firebase UID and add to `VITE_OWNER_FIREBASE_UID`

### 5. Firebase CLI Setup
```bash
firebase login
firebase use --add
# Select your Firebase project
```

## Production Deployment

### Option 1: Firebase Hosting (Recommended)

#### Manual Deployment
```bash
# Build the application
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

#### Automated Deployment (GitHub Actions)
1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add these secrets:
   - `FIREBASE_SERVICE_ACCOUNT`: Your Firebase service account JSON
   - `FIREBASE_PROJECT_ID`: Your Firebase project ID

3. The deployment will trigger automatically on pushes to main branch

### Option 2: Other Hosting Providers

#### Vercel
```bash
npm install -g vercel
vercel --prod
```

#### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## Security Configuration

### Firestore Security Rules
Update `firestore.rules` for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Blog posts - public read, admin write
    match /blogs/{document} {
      allow read: if true;
      allow write: if request.auth != null &&
        request.auth.uid == 'your-admin-uid';
    }

    // Videos - public read, admin write
    match /videos/{document} {
      allow read: if true;
      allow write: if request.auth != null &&
        request.auth.uid == 'your-admin-uid';
    }

    // Photos - public read, admin write
    match /photos/{document} {
      allow read: if true;
      allow write: if request.auth != null &&
        request.auth.uid == 'your-admin-uid';
    }

    // Creator profiles - authenticated users
    match /creatorProfiles/{document} {
      allow read, write: if request.auth != null &&
        request.auth.uid == userId();
    }
  }
}
```

### Storage Security Rules
Update `storage.rules` for production:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Images - public read, admin write
    match /images/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null &&
        request.auth.uid == 'your-admin-uid';
    }

    // Videos - public read, admin write
    match /videos/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null &&
        request.auth.uid == 'your-admin-uid';
    }
  }
}
```

## Environment Management

### Multiple Environments
Create separate Firebase projects for different environments:

- **Development**: `simplysoph-dev`
- **Staging**: `simplysoph-staging`
- **Production**: `simplysoph-prod`

### Environment Variables
Maintain separate `.env` files:

- `.env.development`
- `.env.staging`
- `.env.production`

## Performance Optimization

### Build Optimization
```bash
# Analyze bundle size
npm run build -- --mode analyze

# Preview production build
npm run preview
```

### CDN Configuration
Firebase Hosting automatically provides CDN. For custom CDN:

1. Configure Cloudflare or similar
2. Update DNS settings
3. Deploy static assets to CDN

## Monitoring & Analytics

### Firebase Analytics
Already configured. Monitor in Firebase Console:
- User engagement
- Content performance
- Error tracking

### Performance Monitoring
Use Firebase Performance Monitoring:
```javascript
// Add to main.tsx
import { getPerformance } from 'firebase/performance';
getPerformance(app);
```

## Troubleshooting

### Common Issues

#### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Firebase Deployment Fails
```bash
# Check Firebase project
firebase projects:list
firebase use your-project-id

# Check hosting configuration
firebase hosting:sites:list
```

#### Authentication Issues
- Verify Firebase Auth domain configuration
- Check OAuth redirect URIs
- Ensure admin UID is correct

#### Content Not Loading
- Check Firestore security rules
- Verify Firebase configuration
- Check browser console for errors

## Backup & Recovery

### Firestore Backups
```bash
# Manual export
gcloud firestore export gs://your-backup-bucket --project=your-project-id

# Scheduled backups via Cloud Scheduler
# Configure in Google Cloud Console
```

### Code Repository
- Use Git for version control
- Regular commits and tags
- Branch protection rules

## Support

For deployment issues:
1. Check this documentation
2. Review Firebase Console logs
3. Check GitHub Issues for known problems
4. Contact development team

## Maintenance Schedule

- **Daily**: Monitor error logs and performance
- **Weekly**: Review analytics and user feedback
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Performance audits and optimization</content>
<parameter name="filePath">c:\Users\saulp\AppData\Workspace\SimplySoph-SimplySoph\docs\DEPLOYMENT.md