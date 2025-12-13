# Troubleshooting Guide

## Common Issues & Solutions

### Authentication Issues

#### "Auth domain not authorized"
**Symptoms**: Login fails with domain authorization error
**Cause**: Firebase Auth domain not configured
**Solution**:
1. Go to Firebase Console → Authentication → Settings
2. Add your domain to "Authorized domains"
3. For local development: Add `localhost`
4. For production: Add your custom domain

#### "Invalid API key"
**Symptoms**: Authentication requests fail
**Cause**: Incorrect Firebase API key in environment variables
**Solution**:
```bash
# Check .env file
VITE_FIREBASE_API_KEY=your-correct-api-key

# Get correct key from Firebase Console → Project Settings → General → Your apps
```

#### Admin access not working
**Symptoms**: Can't access admin routes despite being logged in
**Cause**: Incorrect admin UID configuration
**Solution**:
```bash
# Get your Firebase UID after login
# Check browser console or Firebase Auth console
VITE_OWNER_FIREBASE_UID=your-firebase-uid-here
```

### Content Management Issues

#### Rich text editor not loading
**Symptoms**: Blog editor shows basic textarea instead of rich editor
**Cause**: Tiptap dependencies not installed or import errors
**Solution**:
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/pm

# Check imports in RichTextEditor.tsx
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
```

#### Content not saving
**Symptoms**: Blog posts/videos don't persist after creation
**Cause**: Firestore permissions or network issues
**Solution**:
1. Check Firestore security rules
2. Verify Firebase configuration
3. Check browser network tab for errors
4. Ensure user is authenticated

#### Images not uploading
**Symptoms**: Image uploads fail in rich text editor
**Cause**: Storage permissions or CORS issues
**Solution**:
1. Check Firebase Storage rules
2. Verify storage bucket configuration
3. Check browser console for CORS errors

### Performance Issues

#### Slow page loads
**Symptoms**: Pages take >3 seconds to load
**Cause**: Large bundle size or unoptimized assets
**Solution**:
```bash
# Analyze bundle
npm run build -- --mode analyze

# Check for unused imports
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer dist/static/js/*.js
```

#### High memory usage
**Symptoms**: Browser tab uses excessive memory
**Cause**: Memory leaks or large component trees
**Solution**:
1. Check for unnecessary re-renders with React DevTools
2. Implement proper memoization
3. Remove unused Radix UI components

### Build & Deployment Issues

#### Build fails
**Symptoms**: `npm run build` exits with errors
**Cause**: TypeScript errors or missing dependencies
**Solution**:
```bash
# Clear cache
rm -rf node_modules/.vite
npm run build

# Check TypeScript
npx tsc --noEmit

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Firebase deployment fails
**Symptoms**: `firebase deploy` returns error
**Cause**: Incorrect project configuration or permissions
**Solution**:
```bash
# Check Firebase project
firebase projects:list
firebase use your-project-id

# Login to Firebase
firebase login

# Check hosting configuration
firebase hosting:sites:list
```

### SEO & Social Sharing Issues

#### Meta tags not working
**Symptoms**: Social shares don't show proper preview
**Cause**: MetaTags component not implemented or incorrect props
**Solution**:
```tsx
// Check MetaTags usage
<MetaTags
  title="Page Title"
  description="Page description"
  image="/og-image.png"
  url={window.location.href}
  type="article"
/>
```

#### Open Graph images not loading
**Symptoms**: Social platforms show broken images
**Cause**: Incorrect image paths or CORS issues
**Solution**:
1. Use absolute URLs for og:image
2. Ensure images are publicly accessible
3. Check image dimensions (recommended: 1200x630)

### Mobile Responsiveness Issues

#### Layout breaks on mobile
**Symptoms**: Content overflows or elements misalign
**Cause**: CSS not optimized for mobile screens
**Solution**:
```css
/* Check responsive classes */
@media (max-width: 768px) {
  .mobile-hidden { display: none; }
  .mobile-full { width: 100%; }
}
```

#### Touch interactions not working
**Symptoms**: Buttons don't respond to touch
**Cause**: Missing touch event handlers or CSS issues
**Solution**:
```css
/* Ensure proper touch targets */
button, a, input {
  min-height: 44px; /* iOS minimum */
  min-width: 44px;
}
```

### Database Issues

#### Firestore queries failing
**Symptoms**: Content doesn't load, console shows permission errors
**Cause**: Security rules too restrictive or incorrect
**Solution**:
```javascript
// Check Firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /blogs/{document} {
      allow read: if true; // Public read
      allow write: if request.auth != null &&
        request.auth.uid == 'your-admin-uid';
    }
  }
}
```

#### Real-time updates not working
**Symptoms**: Content doesn't update automatically
**Cause**: onSnapshot listeners not properly configured
**Solution**:
```javascript
// Check ENABLE_REALTIME_FEED setting
const ENABLE_REALTIME_FEED = true;

useEffect(() => {
  if (!ENABLE_REALTIME_FEED) return;

  const unsubscribe = onSnapshot(
    query(collection(db, 'blogs'), orderBy('publishedAt', 'desc')),
    (snapshot) => {
      // Handle real-time updates
    }
  );

  return unsubscribe;
}, []);
```

### Network & Connectivity Issues

#### CORS errors
**Symptoms**: API requests blocked by CORS policy
**Cause**: Firebase configuration or hosting setup
**Solution**:
1. Check Firebase Hosting configuration
2. Verify domain is authorized in Firebase Console
3. Add CORS headers if using custom backend

#### Slow API responses
**Symptoms**: Firebase requests take >2 seconds
**Cause**: Network issues or unoptimized queries
**Solution**:
1. Check network tab in browser dev tools
2. Add indexes for complex queries
3. Implement caching with React Query

### Development Environment Issues

#### Hot reload not working
**Symptoms**: Changes don't reflect in browser
**Cause**: Vite dev server issues
**Solution**:
```bash
# Restart dev server
npm run dev

# Clear cache
rm -rf node_modules/.vite
```

#### TypeScript errors
**Symptoms**: Red squiggly lines in editor
**Cause**: Type definitions missing or incorrect
**Solution**:
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Install missing types
npm install --save-dev @types/package-name
```

### Browser Compatibility Issues

#### Features not working in older browsers
**Symptoms**: Modern JavaScript features fail
**Cause**: Missing polyfills or unsupported APIs
**Solution**:
```javascript
// Add to vite.config.ts
export default defineConfig({
  esbuild: {
    target: 'es2015'
  },
  optimizeDeps: {
    include: ['polyfills']
  }
})
```

#### CSS not loading properly
**Symptoms**: Styles broken or missing
**Cause**: Tailwind CSS configuration issues
**Solution**:
```bash
# Rebuild CSS
npm run build

# Check Tailwind config
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

## Diagnostic Tools

### Browser Developer Tools
- **Network Tab**: Check for failed requests
- **Console Tab**: Look for JavaScript errors
- **Application Tab**: Inspect local storage and service workers

### Firebase Tools
```bash
# Check Firebase project status
firebase projects:list

# View hosting configuration
firebase hosting:sites:list

# Check functions logs
firebase functions:log
```

### Performance Monitoring
```bash
# Lighthouse audit
npm install -g lighthouse
lighthouse http://localhost:5173

# Bundle analyzer
npm install -g webpack-bundle-analyzer
```

## Getting Help

### Support Channels
1. **GitHub Issues**: Report bugs with detailed reproduction steps
2. **Documentation**: Check this troubleshooting guide first
3. **Firebase Console**: Review error logs and analytics
4. **Community**: Check Discord/Slack for similar issues

### Information to Provide
When reporting issues, include:
- Browser and version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Console errors (screenshots)
- Network request failures

### Emergency Contacts
- **Critical Issues**: Contact development team immediately
- **Security Issues**: Report to security@company.com
- **Performance Issues**: Check Firebase Console first

## Prevention Best Practices

### Development
- [ ] Write tests for critical functionality
- [ ] Use TypeScript for type safety
- [ ] Implement error boundaries
- [ ] Follow React best practices

### Deployment
- [ ] Test in staging environment first
- [ ] Monitor performance after deployment
- [ ] Have rollback plan ready
- [ ] Document deployment process

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Monitor performance metrics
- [ ] Review analytics regularly
- [ ] Set up alerts for critical issues

This guide covers the most common issues encountered during development and production use of SimplySoph. Regular updates will be made as new issues are discovered and resolved.</content>
<parameter name="filePath">c:\Users\saulp\AppData\Workspace\SimplySoph-SimplySoph\docs\TROUBLESHOOTING.md