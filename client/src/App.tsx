import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
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
const Passport = lazy(() => import("./pages/Passport"));
const Destination = lazy(() => import("./pages/Destination"));
const MediaKit = lazy(() => import("./pages/MediaKit"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
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
const AdminDestinationList  = lazy(() => import("./pages/admin/DestinationList"));
const AdminDestinationEdit  = lazy(() => import("./pages/admin/DestinationEdit"));
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
      <Route path="/media-kit">{() => renderLazyRoute(MediaKit)}</Route>
      <Route path="/privacy-policy">{() => renderLazyRoute(PrivacyPolicy)}</Route>
      <Route path="/terms-of-service">{() => renderLazyRoute(TermsOfService)}</Route>
      <Route path="/about">{() => renderLazyRoute(About)}</Route>
      <Route path="/contact">{() => renderLazyRoute(Contact)}</Route>
      <Route path="/login">{() => renderLazyRoute(Login)}</Route>

      {/* Protected admin routes — role gated before rendering admin chunks */}
      <Route path="/admin/blog">
        {() => (
          <RequireAuth role="admin">
            {renderLazyRoute(AdminBlogList, AdminLoader)}
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/blog/new">
        {() => (
          <RequireAuth role="admin">
            {renderLazyRoute(AdminBlogEdit, AdminLoader)}
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/blog/edit">
        {() => (
          <RequireAuth role="admin">
            {renderLazyRoute(AdminBlogEdit, AdminLoader)}
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/blog/edit/:id">
        {() => (
          <RequireAuth role="admin">
            {renderLazyRoute(AdminBlogEdit, AdminLoader)}
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/video">
        {() => (
          <RequireAuth role="admin">
            {renderLazyRoute(AdminVideoList, AdminLoader)}
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/video/new">
        {() => (
          <RequireAuth role="admin">
            {renderLazyRoute(AdminVideoEdit, AdminLoader)}
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/video/edit/:id">
        {() => (
          <RequireAuth role="admin">
            {renderLazyRoute(AdminVideoEdit, AdminLoader)}
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/photo">
        {() => (
          <RequireAuth role="admin">
            {renderLazyRoute(AdminPhotoList, AdminLoader)}
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/photo/new">
        {() => (
          <RequireAuth role="admin">
            {renderLazyRoute(AdminPhotoEdit, AdminLoader)}
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/photo/edit/:id">
        {() => (
          <RequireAuth role="admin">
            {renderLazyRoute(AdminPhotoEdit, AdminLoader)}
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/destinations">
        {() => (
          <RequireAuth role="admin">
            {renderLazyRoute(AdminDestinationList, AdminLoader)}
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/destinations/new">
        {() => (
          <RequireAuth role="admin">
            {renderLazyRoute(AdminDestinationEdit, AdminLoader)}
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/destinations/:id">
        {() => (
          <RequireAuth role="admin">
            {renderLazyRoute(AdminDestinationEdit, AdminLoader)}
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/category">
        {() => (
          <RequireAuth role="admin">
            {renderLazyRoute(AdminCategoryList, AdminLoader)}
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/category/new">
        {() => (
          <RequireAuth role="admin">
            {renderLazyRoute(AdminCategoryEdit, AdminLoader)}
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/category/edit/:id">
        {() => (
          <RequireAuth role="admin">
            {renderLazyRoute(AdminCategoryEdit, AdminLoader)}
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/comments">
        {() => (
          <RequireAuth role="admin">
            {renderLazyRoute(AdminCommentModeration, AdminLoader)}
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin/calendar">
        {() => (
          <RequireAuth role="admin">
            {renderLazyRoute(AdminContentCalendar, AdminLoader)}
          </RequireAuth>
        )}
      </Route>
      <Route path="/admin">
        {() => (
          <RequireAuth role="admin">
            {renderLazyRoute(AdminDashboard, AdminLoader)}
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
