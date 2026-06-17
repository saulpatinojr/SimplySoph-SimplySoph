import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import PwaInstallPrompt from "./components/PwaInstallPrompt";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Videos from "./pages/Videos";
import VideoDetail from "./pages/VideoDetail";
import Photos from "./pages/Photos";
import PhotoAlbum from "./pages/PhotoAlbum";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import { lazy, Suspense, useEffect, type ComponentType } from "react";
import { useAuth } from "./_core/hooks/useAuth";

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

// ── Protected Route wrapper ─────────────────────────────────────────────────
// Redirects unauthenticated users to /login instead of showing admin UI.
function ProtectedRoute({ component: Component }: { component: ComponentType }) {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "var(--primary)" }} />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <Component />;
}

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

      {/* Protected admin routes — all wrapped in ProtectedRoute */}
      <Suspense fallback={AdminLoader}>
        <Route path="/admin">
          {() => <ProtectedRoute component={AdminDashboard} />}
        </Route>
        <Route path="/admin/blog">
          {() => <ProtectedRoute component={AdminBlogList} />}
        </Route>
        <Route path="/admin/blog/new">
          {() => <ProtectedRoute component={AdminBlogEdit} />}
        </Route>
        <Route path="/admin/blog/edit">
          {() => <ProtectedRoute component={AdminBlogEdit} />}
        </Route>
        <Route path="/admin/blog/edit/:id">
          {() => <ProtectedRoute component={AdminBlogEdit} />}
        </Route>
        <Route path="/admin/video">
          {() => <ProtectedRoute component={AdminVideoList} />}
        </Route>
        <Route path="/admin/video/new">
          {() => <ProtectedRoute component={AdminVideoEdit} />}
        </Route>
        <Route path="/admin/video/edit/:id">
          {() => <ProtectedRoute component={AdminVideoEdit} />}
        </Route>
        <Route path="/admin/photo">
          {() => <ProtectedRoute component={AdminPhotoList} />}
        </Route>
        <Route path="/admin/photo/new">
          {() => <ProtectedRoute component={AdminPhotoEdit} />}
        </Route>
        <Route path="/admin/photo/edit/:id">
          {() => <ProtectedRoute component={AdminPhotoEdit} />}
        </Route>
        <Route path="/admin/category">
          {() => <ProtectedRoute component={AdminCategoryList} />}
        </Route>
        <Route path="/admin/category/new">
          {() => <ProtectedRoute component={AdminCategoryEdit} />}
        </Route>
        <Route path="/admin/category/edit/:id">
          {() => <ProtectedRoute component={AdminCategoryEdit} />}
        </Route>
        <Route path="/admin/comments">
          {() => <ProtectedRoute component={AdminCommentModeration} />}
        </Route>
        <Route path="/admin/calendar">
          {() => <ProtectedRoute component={AdminContentCalendar} />}
        </Route>
      </Suspense>

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
