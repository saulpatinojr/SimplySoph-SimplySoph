# Copilot / AI assistant instructions — SimplySoph

Keep suggestions focused and actionable for this repository. Prefer small, safe edits and follow existing conventions.

## Key Project Overview
- **Frontend-only React app** built with Vite, using Firebase (Firestore, Auth, Storage) as backend
- **Content management platform** for fashion creator with blog posts, videos, and photo albums
- **Admin dashboard** for content creation and management with role-based access
- **SEO-optimized** with dynamic meta tags for social sharing and search engines
- **Responsive design** using Tailwind CSS 4.x + Radix UI components

## Developer Workflows and Commands
- **Start dev server**: `npm run dev` or `npx vite` (runs on port 5173)
- **Build for production**: `npm run build` (outputs to `dist/`)
- **Preview production build**: `npm run preview`
- **Type checking**: `npx tsc --noEmit`
- **Testing**: `npm test` (vitest)
- **Formatting**: `npm run format` (prettier)

## Important Code Patterns & Conventions

### Authentication & Authorization
- **Firebase Auth** with Google OAuth via `useAuth` hook (see `src/_core/hooks/useAuth.ts`)
- **Admin role checking**: `user?.role === "admin"` for protected routes
- **Creator profiles**: Auto-created via `upsertCreatorProfile` on login
- **Owner UID**: Set via `VITE_OWNER_FIREBASE_UID` env var for admin access

### Data Layer (Firebase Firestore)
- **Content operations** in `src/lib/content.ts`: `fetchAllBlogPosts()`, `saveVideo()`, `deleteVideo()`, etc.
- **Real-time subscriptions**: Use `onSnapshot` for live updates (controlled by `ENABLE_REALTIME_FEED`)
- **Document structure**: Collections for `blogs`, `videos`, `albums`, `photos`, `creatorProfiles`
- **Query patterns**: `orderBy("publishedAt", "desc")` for content feeds, `where("authorId", "==", userId)` for ownership

### Component Architecture
- **Admin pages**: Follow pattern in `src/pages/admin/` - auth check, loading states, CRUD operations
- **UI components**: Radix UI primitives in `src/components/ui/` with Tailwind styling
- **Meta tags**: Use `MetaTags` component for SEO (see `src/components/MetaTags.tsx`)
- **Error boundaries**: Wrap routes with `ErrorBoundary` component

### Routing & Navigation
- **Wouter routing**: File-based routing in `src/App.tsx` with dynamic segments (`/blog/:slug`)
- **Admin routes**: `/admin/*` for content management, `/admin/blog/*`, `/admin/video/*`
- **Protected routes**: Manual auth checks in components (not middleware-based)

### State Management
- **TanStack Query**: For server state - `useQuery` for fetches, `useMutation` for updates
- **Local component state**: React hooks for form state and UI interactions
- **Firebase Auth state**: Managed via `useAuth` hook with automatic profile hydration

## Integration Points & External Services

### Firebase Services
- **Authentication**: Google OAuth with profile auto-creation
- **Firestore**: Document database for all content and user data
- **Storage**: File uploads (future implementation for media files)
- **Analytics**: Optional Firebase Analytics initialization

### UI/UX Libraries
- **Radix UI**: Headless components for accessibility (dialogs, dropdowns, etc.)
- **Tailwind CSS 4.x**: Utility-first styling with custom design tokens
- **Lucide React**: Icon library for consistent iconography
- **Framer Motion**: Animations and transitions
- **Sonner**: Toast notifications

## Environment Configuration
- **Environment variables**: Prefixed with `VITE_` for client-side access
- **Firebase config**: Required for all features (API keys, project IDs)
- **Owner UID**: Must be set for admin functionality
- **App metadata**: `VITE_APP_TITLE`, `VITE_APP_LOGO` for branding

## Quick Examples to Reference

### Adding a new admin page:
```tsx
// src/pages/admin/NewContent.tsx
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect } from "wouter";
import { LOGIN_PATH } from "@/const";

export default function AdminNewContent() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Redirect to={LOGIN_PATH} />;
  }

  // Component logic here
}
```

### Firebase data operation:
```typescript
// In src/lib/content.ts
export async function fetchContentById(id: string): Promise<ContentType | null> {
  const snapshot = await getDoc(doc(db(), "collectionName", id));
  if (!snapshot.exists()) return null;
  return mapContent(withId(snapshot));
}
```

### Using TanStack Query:
```tsx
const { data: content, isLoading } = useQuery({
  queryKey: ["content", "list"],
  queryFn: () => fetchContent(),
  enabled: isAuthenticated,
});
```

### Adding meta tags:
```tsx
<MetaTags
  title="Page Title"
  description="Page description for SEO"
  image="/og-image.png"
  url="/page-url"
  type="article"
/>
```

## Development Best Practices

### Code Organization
- **Feature-based**: Group related components, hooks, and utilities
- **Consistent imports**: Use `@/` alias for `src/` directory
- **Type safety**: Strict TypeScript with proper type definitions

### Performance Considerations
- **Query optimization**: Use `enabled` prop to prevent unnecessary requests
- **Image optimization**: Future implementation needed for media files
- **Bundle analysis**: Monitor for unused dependencies (60+ Radix components currently)

### Testing Strategy
- **Unit tests**: Component and utility function testing with vitest
- **Integration tests**: Firebase operations and auth flows
- **E2E tests**: Critical user journeys (login, content creation)

### Deployment & Production
- **Firebase Hosting**: Static site hosting with CDN
- **Environment separation**: Separate Firebase projects for dev/staging/prod
- **Security rules**: Firestore and Storage rules for data protection

When editing code, prefer minimal, incremental changes. If anything is unclear or you need credentials/env values, ask the maintainers rather than hard-coding secrets.

— End of file —
