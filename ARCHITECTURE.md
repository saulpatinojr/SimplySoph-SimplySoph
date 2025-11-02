# SimplySoph Architecture Documentation

## Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Routing**: Wouter (lightweight)
- **Styling**: Tailwind CSS 4 + Radix UI components
- **State**: React Query (TanStack Query)
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod validation

### Backend
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Storage**: Firebase Storage
- **Hosting**: Firebase Hosting

### Design System
- **Fonts**: Playfair Display (headings), DM Sans (body)
- **Colors**: Cherry Red, Butter Yellow, Rose Gold accents
- **Style**: Luxury fashion aesthetic with Gen Z vibes

## Project Structure

```
SimplySoph-SimplySoph/
├── client/src/
│   ├── _core/hooks/          # Core hooks (useAuth)
│   ├── components/
│   │   ├── ui/               # 60+ Radix UI components
│   │   ├── Navigation.tsx    # Main nav
│   │   ├── Footer.tsx        # Site footer
│   │   └── DashboardLayout.tsx
│   ├── contexts/             # Theme context
│   ├── hooks/                # Custom hooks
│   ├── lib/
│   │   ├── firebase.ts       # Firebase initialization
│   │   ├── content.ts        # Firestore CRUD operations
│   │   └── utils.ts          # Utilities
│   ├── pages/
│   │   ├── Home.tsx          # Landing page
│   │   ├── Blog.tsx          # Blog listing
│   │   ├── BlogPost.tsx      # Single post
│   │   ├── Videos.tsx        # Video gallery
│   │   ├── Photos.tsx        # Photo albums
│   │   ├── About.tsx         # About page
│   │   ├── Contact.tsx       # Contact page
│   │   ├── Login.tsx         # Auth page
│   │   └── admin/
│   │       ├── Dashboard.tsx # Admin overview
│   │       ├── BlogList.tsx  # Manage posts
│   │       └── BlogEdit.tsx  # Create/edit posts
│   └── App.tsx               # Root component
├── server/                   # Backend (currently unused)
├── shared/                   # Shared types
├── .env                      # Environment variables
├── firebase.json             # Firebase config
├── firestore.rules           # Security rules
└── firestore.indexes.json    # Database indexes
```

## Data Models

### BlogPost
- title, slug, excerpt, content
- coverImage, categoryId
- status (draft/published)
- authorId, readingTime, views, likes
- publishedAt, createdAt, updatedAt

### VideoEntry
- title, slug, description
- videoUrl, thumbnailUrl
- categoryId, authorId, views
- publishedAt, createdAt

### PhotoAlbum
- title, slug, description
- coverImage, categoryId
- authorId, createdAt

### Photo
- albumId, imageUrl, caption
- order, createdAt

### CreatorProfile
- name, email, avatarUrl
- role (user/admin)
- bio, socials, lastSeenAt

## Routes

### Public
- `/` - Home
- `/blog` - Blog listing
- `/blog/:slug` - Single post
- `/videos` - Video gallery
- `/photos` - Photo albums
- `/about` - About page
- `/contact` - Contact page
- `/login` - Authentication

### Admin (Protected)
- `/admin` - Dashboard
- `/admin/blog` - Blog management
- `/admin/blog/new` - Create post
- `/admin/blog/edit/:id` - Edit post

## Firebase Security Rules

- **Public read**: Published blog posts, videos, photos
- **Admin only**: Create/update/delete content
- **User profiles**: Self-read, admin-read, self-create with user role
- **Admin collection**: No public access

## Environment Variables

Required in `.env` and GitHub Secrets:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_OWNER_FIREBASE_UID` (admin user ID)
- `VITE_ENABLE_REALTIME_FEED` (optional)

## Deployment

### GitHub Actions Workflows
1. **Pull Request**: Preview deployment on PR
2. **Main Branch**: Production deployment on merge

Both workflows require GitHub Secrets configured with Firebase credentials.

### Build Process
```bash
npm ci && npm run build
```
Output: `dist/` directory deployed to Firebase Hosting

## Key Features

### Implemented
✅ Landing page with hero & featured content
✅ Blog listing with categories
✅ Individual blog post pages
✅ Video gallery
✅ Photo albums
✅ Admin dashboard with analytics
✅ Blog post creation/editing (rich text)
✅ Firebase authentication
✅ Responsive design
✅ Luxury fashion aesthetic
✅ Real-time feed (optional)

### Pending
❌ Comment system UI
❌ Search functionality
❌ Newsletter signup
❌ Social share buttons
❌ Image lightbox
❌ Instagram feed integration
❌ Related posts
❌ Video/photo upload in admin
❌ Category management UI
