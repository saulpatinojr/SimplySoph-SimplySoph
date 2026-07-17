import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import PwaInstallPrompt from "./components/PwaInstallPrompt";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import RequireAuth from "./components/RequireAuth";
import ImageProtection from "./components/ImageProtection";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SiteConfigProvider, useSiteConfig } from "./contexts/SiteConfigContext";
import { lazy, Suspense, useEffect, type ComponentType } from "react";

// After a deploy, a client holding the previous index.html requests hashed
// chunks that no longer exist. Reload once to pick up the fresh manifest;
// if the chunk is still missing, rethrow into the route error boundary.
const CHUNK_RELOAD_KEY = "chunk-reload-at";
function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() =>
    factory().catch((error: unknown) => {
      const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? 0);
      if (Date.now() - last > 10_000) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
        window.location.reload();
      }
      throw error;
    })
  );
}

// Lazy load public pages so the initial route chunk stays small.
const Home = lazyWithRetry(() => import("./pages/Home"));
const Blog = lazyWithRetry(() => import("./pages/Blog"));
const BlogPost = lazyWithRetry(() => import("./pages/BlogPost"));
const Videos = lazyWithRetry(() => import("./pages/Videos"));
const VideoDetail = lazyWithRetry(() => import("./pages/VideoDetail"));
const Photos = lazyWithRetry(() => import("./pages/Photos"));
const PhotoAlbum = lazyWithRetry(() => import("./pages/PhotoAlbum"));
const Passport = lazyWithRetry(() => import("./pages/Passport"));
const Destination = lazyWithRetry(() => import("./pages/Destination"));
const Menagerie = lazyWithRetry(() => import("./pages/Menagerie"));
const MenagerieDetail = lazyWithRetry(() => import("./pages/MenagerieDetail"));
const Looks = lazyWithRetry(() => import("./pages/Looks"));
const LookDetail = lazyWithRetry(() => import("./pages/LookDetail"));
const MediaKit = lazyWithRetry(() => import("./pages/MediaKit"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazyWithRetry(() => import("./pages/TermsOfService"));
const About = lazyWithRetry(() => import("./pages/About"));
const Contact = lazyWithRetry(() => import("./pages/Contact"));
const Login = lazyWithRetry(() => import("./pages/Login"));

// Lazy load admin components
const AdminDashboard        = lazyWithRetry(() => import("./pages/admin/Dashboard"));
const AdminBlogList         = lazyWithRetry(() => import("./pages/admin/BlogList"));
const AdminBlogEdit         = lazyWithRetry(() => import("./pages/admin/BlogEdit"));
const AdminVideoList        = lazyWithRetry(() => import("./pages/admin/VideoList"));
const AdminVideoEdit        = lazyWithRetry(() => import("./pages/admin/VideoEdit"));
const AdminPhotoList        = lazyWithRetry(() => import("./pages/admin/PhotoList"));
const AdminPhotoEdit        = lazyWithRetry(() => import("./pages/admin/PhotoEdit"));
const AdminDestinationList  = lazyWithRetry(() => import("./pages/admin/DestinationList"));
const AdminDestinationEdit  = lazyWithRetry(() => import("./pages/admin/DestinationEdit"));
const AdminCategoryList     = lazyWithRetry(() => import("./pages/admin/CategoryList"));
const AdminCategoryEdit     = lazyWithRetry(() => import("./pages/admin/CategoryEdit"));
const AdminCommentModeration = lazyWithRetry(() => import("./pages/admin/CommentModeration"));
const AdminContentCalendar  = lazyWithRetry(() => import("./pages/admin/ContentCalendar"));
const AdminMediaLibrary     = lazyWithRetry(() => import("./pages/admin/MediaLibrary"));
const AdminMenagerieList    = lazyWithRetry(() => import("./pages/admin/MenagerieList"));
const AdminMenagerieEdit    = lazyWithRetry(() => import("./pages/admin/MenagerieEdit"));
const AdminMenagerieBlogEdit = lazyWithRetry(() => import("./pages/admin/MenagerieBlogEdit"));
const AdminLookList         = lazyWithRetry(() => import("./pages/admin/LookList"));
const AdminLookEdit         = lazyWithRetry(() => import("./pages/admin/LookEdit"));
const AdminSettings         = lazyWithRetry(() => import("./pages/admin/Settings"));

// Single source of truth for the admin surface. Convention:
// /admin/<section> (list), /admin/<section>/new, /admin/<section>/edit/:id.
// ORDER MATTERS: wouter's <Switch> is first-match-wins, so specific paths
// must precede the bare /admin entry (keep it last), and param routes must
// not shadow static ones. admin-routes.test.ts enforces these invariants —
// exported for that test.
export const ADMIN_ROUTES: Array<{ path: string; component: ComponentType }> = [
  { path: "/admin/blog",                  component: AdminBlogList },
  { path: "/admin/blog/new",              component: AdminBlogEdit },
  { path: "/admin/blog/edit/:id",         component: AdminBlogEdit },
  { path: "/admin/video",                 component: AdminVideoList },
  { path: "/admin/video/new",             component: AdminVideoEdit },
  { path: "/admin/video/edit/:id",        component: AdminVideoEdit },
  { path: "/admin/media",                 component: AdminMediaLibrary },
  { path: "/admin/photo",                 component: AdminPhotoList },
  { path: "/admin/photo/new",             component: AdminPhotoEdit },
  { path: "/admin/photo/edit/:id",        component: AdminPhotoEdit },
  { path: "/admin/destinations",          component: AdminDestinationList },
  { path: "/admin/destinations/new",      component: AdminDestinationEdit },
  { path: "/admin/destinations/edit/:id", component: AdminDestinationEdit },
  { path: "/admin/menagerie",             component: AdminMenagerieList },
  { path: "/admin/menagerie/new",         component: AdminMenagerieEdit },
  { path: "/admin/menagerie/edit/:id",    component: AdminMenagerieEdit },
  { path: "/admin/menagerie/blog/new",    component: AdminMenagerieBlogEdit },
  { path: "/admin/menagerie/blog/edit/:id", component: AdminMenagerieBlogEdit },
  { path: "/admin/looks",                 component: AdminLookList },
  { path: "/admin/looks/new",             component: AdminLookEdit },
  { path: "/admin/looks/edit/:id",        component: AdminLookEdit },
  { path: "/admin/category",              component: AdminCategoryList },
  { path: "/admin/category/new",          component: AdminCategoryEdit },
  { path: "/admin/category/edit/:id",     component: AdminCategoryEdit },
  { path: "/admin/comments",              component: AdminCommentModeration },
  { path: "/admin/calendar",              component: AdminContentCalendar },
  { path: "/admin/settings",              component: AdminSettings },
  { path: "/admin",                       component: AdminDashboard },
];

// ── Admin loading fallback ──────────────────────────────────────────────────
const AdminLoader = (
  <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "var(--primary)" }} />
      <p className="text-sm font-sans" style={{ color: "var(--muted-foreground)" }}>Loading studio…</p>
    </div>
  </div>
);

const PageLoader = (
  <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
    <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "var(--primary)" }} />
  </div>
);

// ── Router ──────────────────────────────────────────────────────────────────
function Router() {
  const withBoundary = (component: ComponentType) => {
    const Component = component;
    return (
      <RouteErrorBoundary>
        <Component />
      </RouteErrorBoundary>
    );
  };

  const renderLazyRoute = (component: ComponentType, fallback = PageLoader) => (
    <Suspense fallback={fallback}>{withBoundary(component)}</Suspense>
  );

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/">{() => renderLazyRoute(Home)}</Route>
      <Route path="/blog">{() => renderLazyRoute(Blog)}</Route>
      <Route path="/blog/:slug">{() => renderLazyRoute(BlogPost)}</Route>
      <Route path="/videos">{() => renderLazyRoute(Videos)}</Route>
      <Route path="/videos/:slug">{() => renderLazyRoute(VideoDetail)}</Route>
      <Route path="/photos">{() => renderLazyRoute(Photos)}</Route>
      <Route path="/photos/:slug">{() => renderLazyRoute(PhotoAlbum)}</Route>
      <Route path="/passport">{() => renderLazyRoute(Passport)}</Route>
      <Route path="/passport/:slug">{() => renderLazyRoute(Destination)}</Route>
      <Route path="/menagerie">{() => renderLazyRoute(Menagerie)}</Route>
      <Route path="/menagerie/:slug">{() => renderLazyRoute(MenagerieDetail)}</Route>
      <Route path="/looks">{() => renderLazyRoute(Looks)}</Route>
      <Route path="/looks/:slug">{() => renderLazyRoute(LookDetail)}</Route>
      <Route path="/media-kit">{() => renderLazyRoute(MediaKit)}</Route>
      <Route path="/privacy-policy">{() => renderLazyRoute(PrivacyPolicy)}</Route>
      <Route path="/terms-of-service">{() => renderLazyRoute(TermsOfService)}</Route>
      <Route path="/about">{() => renderLazyRoute(About)}</Route>
      <Route path="/contact">{() => renderLazyRoute(Contact)}</Route>
      <Route path="/login">{() => renderLazyRoute(Login)}</Route>

      {/* Protected admin routes — role gated before rendering admin chunks */}
      {ADMIN_ROUTES.map(({ path, component }) => (
        <Route key={path} path={path}>
          {() => (
            <RequireAuth role="admin">
              {renderLazyRoute(component, AdminLoader)}
            </RequireAuth>
          )}
        </Route>
      ))}
      {/* Legacy destination edit URLs (/admin/destinations/:id) → normalized
          edit route. Registered after /new and /edit/:id so it only catches
          bare ids. */}
      <Route path="/admin/destinations/:id">
        {params =>
          params.id === "new" || params.id === "edit" ? (
            <NotFound />
          ) : (
            <Redirect to={`/admin/destinations/edit/${params.id}`} replace />
          )
        }
      </Route>

      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// ── App ─────────────────────────────────────────────────────────────────────

/** Resolve the admin-configured default mode into the light/dark the
 *  ThemeProvider understands ("system" follows the OS preference). */
function resolveDefaultTheme(mode: "light" | "dark" | "system" | undefined) {
  if (mode === "light" || mode === "dark") return mode;
  if (mode === "system" && typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? ("light" as const)
      : ("dark" as const);
  }
  return "dark" as const;
}

/** Applies theme tokens from siteConfig as CSS variables on :root. Only
 *  properties present in config are set, so index.css stays the fallback. */
function ThemeTokens() {
  const { theme } = useSiteConfig();
  useEffect(() => {
    const root = document.documentElement;
    if (theme.accentColor) root.style.setProperty("--primary", theme.accentColor);
    else root.style.removeProperty("--primary");
    if (theme.radius) root.style.setProperty("--radius", theme.radius);
    else root.style.removeProperty("--radius");
  }, [theme.accentColor, theme.radius]);
  return null;
}

function ThemedApp() {
  const config = useSiteConfig();
  return (
    <ThemeProvider defaultTheme={resolveDefaultTheme(config.theme.defaultMode)}>
      <TooltipProvider>
        <ThemeTokens />
        <Toaster />
        <ImageProtection />
        <Router />
        <PwaInstallPrompt />
      </TooltipProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <SiteConfigProvider>
        <ThemedApp />
      </SiteConfigProvider>
    </ErrorBoundary>
  );
}

export default App;
