import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import PwaInstallPrompt from "./components/PwaInstallPrompt";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import RequireAuth from "./components/RequireAuth";
import { ThemeProvider } from "./contexts/ThemeContext";
import { lazy, Suspense, type ComponentType } from "react";

// Lazy load public pages so the initial route chunk stays small.
const Home = lazy(() => import("./pages/Home"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Videos = lazy(() => import("./pages/Videos"));
const VideoDetail = lazy(() => import("./pages/VideoDetail"));
const Photos = lazy(() => import("./pages/Photos"));
const PhotoAlbum = lazy(() => import("./pages/PhotoAlbum"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));

// Lazy load admin components
const AdminDashboard        = lazy(() => import("./pages/admin/Dashboard"));
const AdminBlogList         = lazy(() => import("./pages/admin/BlogList"));
const AdminBlogEdit         = lazy(() => import("./pages/admin/BlogEdit"));
const AdminVideoList        = lazy(() => import("./pages/admin/VideoList"));
const AdminVideoEdit        = lazy(() => import("./pages/admin/VideoEdit"));
const AdminPhotoList        = lazy(() => import("./pages/admin/PhotoList"));
const AdminPhotoEdit        = lazy(() => import("./pages/admin/PhotoEdit"));
const AdminCategoryList     = lazy(() => import("./pages/admin/CategoryList"));
const AdminCategoryEdit     = lazy(() => import("./pages/admin/CategoryEdit"));
const AdminCommentModeration = lazy(() => import("./pages/admin/CommentModeration"));
const AdminContentCalendar  = lazy(() => import("./pages/admin/ContentCalendar"));

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

  return (
    <Switch>
      {/* Public routes */}
      <Suspense fallback={PageLoader}>
        <Route path="/">{() => withBoundary(Home)}</Route>
        <Route path="/blog">{() => withBoundary(Blog)}</Route>
        <Route path="/blog/:slug">{() => withBoundary(BlogPost)}</Route>
        <Route path="/videos">{() => withBoundary(Videos)}</Route>
        <Route path="/videos/:slug">{() => withBoundary(VideoDetail)}</Route>
        <Route path="/photos">{() => withBoundary(Photos)}</Route>
        <Route path="/photos/:slug">{() => withBoundary(PhotoAlbum)}</Route>
        <Route path="/about">{() => withBoundary(About)}</Route>
        <Route path="/contact">{() => withBoundary(Contact)}</Route>
        <Route path="/login">{() => withBoundary(Login)}</Route>
      </Suspense>

      {/* Protected admin routes — role gated before rendering admin chunks */}
      <Route path="/admin">
        {() => (
          <RequireAuth role="admin">
            <Suspense fallback={AdminLoader}>{withBoundary(AdminDashboard)}</Suspense>
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/blog">
        {() => (
          <RequireAuth role="admin">
            <Suspense fallback={AdminLoader}>{withBoundary(AdminBlogList)}</Suspense>
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/blog/new">
        {() => (
          <RequireAuth role="admin">
            <Suspense fallback={AdminLoader}>{withBoundary(AdminBlogEdit)}</Suspense>
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/blog/edit">
        {() => (
          <RequireAuth role="admin">
            <Suspense fallback={AdminLoader}>{withBoundary(AdminBlogEdit)}</Suspense>
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/blog/edit/:id">
        {() => (
          <RequireAuth role="admin">
            <Suspense fallback={AdminLoader}>{withBoundary(AdminBlogEdit)}</Suspense>
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/video">
        {() => (
          <RequireAuth role="admin">
            <Suspense fallback={AdminLoader}>{withBoundary(AdminVideoList)}</Suspense>
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/video/new">
        {() => (
          <RequireAuth role="admin">
            <Suspense fallback={AdminLoader}>{withBoundary(AdminVideoEdit)}</Suspense>
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/video/edit/:id">
        {() => (
          <RequireAuth role="admin">
            <Suspense fallback={AdminLoader}>{withBoundary(AdminVideoEdit)}</Suspense>
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/photo">
        {() => (
          <RequireAuth role="admin">
            <Suspense fallback={AdminLoader}>{withBoundary(AdminPhotoList)}</Suspense>
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/photo/new">
        {() => (
          <RequireAuth role="admin">
            <Suspense fallback={AdminLoader}>{withBoundary(AdminPhotoEdit)}</Suspense>
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/photo/edit/:id">
        {() => (
          <RequireAuth role="admin">
            <Suspense fallback={AdminLoader}>{withBoundary(AdminPhotoEdit)}</Suspense>
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/category">
        {() => (
          <RequireAuth role="admin">
            <Suspense fallback={AdminLoader}>{withBoundary(AdminCategoryList)}</Suspense>
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/category/new">
        {() => (
          <RequireAuth role="admin">
            <Suspense fallback={AdminLoader}>{withBoundary(AdminCategoryEdit)}</Suspense>
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/category/edit/:id">
        {() => (
          <RequireAuth role="admin">
            <Suspense fallback={AdminLoader}>{withBoundary(AdminCategoryEdit)}</Suspense>
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/comments">
        {() => (
          <RequireAuth role="admin">
            <Suspense fallback={AdminLoader}>{withBoundary(AdminCommentModeration)}</Suspense>
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/calendar">
        {() => (
          <RequireAuth role="admin">
            <Suspense fallback={AdminLoader}>{withBoundary(AdminContentCalendar)}</Suspense>
          </RequireAuth>
        )}
      </Route>

      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// ── App ─────────────────────────────────────────────────────────────────────
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
          <PwaInstallPrompt />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
