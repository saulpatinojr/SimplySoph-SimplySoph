import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Videos from "./pages/Videos";
import VideoDetail from "./pages/VideoDetail";
import Photos from "./pages/Photos";
import PhotoAlbum from "./pages/PhotoAlbum";
import Passport from "./pages/Passport";
import DestinationPage from "./pages/Destination";
import About from "./pages/About";
import Contact from "./pages/Contact";
import MediaKit from "./pages/MediaKit";
import Login from "./pages/Login";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import { lazy, Suspense } from "react";

// Lazy load admin components
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminBlogList = lazy(() => import("./pages/admin/BlogList"));
const AdminBlogEdit = lazy(() => import("./pages/admin/BlogEdit"));
const AdminVideoList = lazy(() => import("./pages/admin/VideoList"));
const AdminVideoEdit = lazy(() => import("./pages/admin/VideoEdit"));
const AdminPhotoList = lazy(() => import("./pages/admin/PhotoList"));
const AdminPhotoEdit = lazy(() => import("./pages/admin/PhotoEdit"));
const AdminCategoryList = lazy(() => import("./pages/admin/CategoryList"));
const AdminCategoryEdit = lazy(() => import("./pages/admin/CategoryEdit"));
const AdminCommentModeration = lazy(
  () => import("./pages/admin/CommentModeration")
);
const AdminContentCalendar = lazy(
  () => import("./pages/admin/ContentCalendar")
);
const AdminDestinationList = lazy(
  () => import("./pages/admin/DestinationList")
);
const AdminDestinationEdit = lazy(
  () => import("./pages/admin/DestinationEdit")
);

function Router() {
  return (
    <Switch>
      <Route path="/">
        {() => (
          <RouteErrorBoundary>
            <Home />
          </RouteErrorBoundary>
        )}
      </Route>
      <Route path="/blog">
        {() => (
          <RouteErrorBoundary>
            <Blog />
          </RouteErrorBoundary>
        )}
      </Route>
      <Route path="/blog/:slug">
        {() => (
          <RouteErrorBoundary>
            <BlogPost />
          </RouteErrorBoundary>
        )}
      </Route>
      <Route path="/videos">
        {() => (
          <RouteErrorBoundary>
            <Videos />
          </RouteErrorBoundary>
        )}
      </Route>
      <Route path="/videos/:slug">
        {() => (
          <RouteErrorBoundary>
            <VideoDetail />
          </RouteErrorBoundary>
        )}
      </Route>
      <Route path="/photos">
        {() => (
          <RouteErrorBoundary>
            <Photos />
          </RouteErrorBoundary>
        )}
      </Route>
      <Route path="/photos/:slug">
        {() => (
          <RouteErrorBoundary>
            <PhotoAlbum />
          </RouteErrorBoundary>
        )}
      </Route>
      <Route path="/passport">
        {() => (
          <RouteErrorBoundary>
            <Passport />
          </RouteErrorBoundary>
        )}
      </Route>
      <Route path="/passport/:slug">
        {() => (
          <RouteErrorBoundary>
            <DestinationPage />
          </RouteErrorBoundary>
        )}
      </Route>
      <Route path="/about">
        {() => (
          <RouteErrorBoundary>
            <About />
          </RouteErrorBoundary>
        )}
      </Route>
      <Route path="/contact">
        {() => (
          <RouteErrorBoundary>
            <Contact />
          </RouteErrorBoundary>
        )}
      </Route>
      <Route path="/media-kit">
        {() => (
          <RouteErrorBoundary>
            <MediaKit />
          </RouteErrorBoundary>
        )}
      </Route>
      <Route path="/privacy-policy">
        {() => (
          <RouteErrorBoundary>
            <PrivacyPolicy />
          </RouteErrorBoundary>
        )}
      </Route>
      <Route path="/terms-of-service">
        {() => (
          <RouteErrorBoundary>
            <TermsOfService />
          </RouteErrorBoundary>
        )}
      </Route>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        }
      >
        <Route path="/admin">
          {() => (
            <RouteErrorBoundary>
              <AdminDashboard />
            </RouteErrorBoundary>
          )}
        </Route>
        <Route path="/admin/blog">
          {() => (
            <RouteErrorBoundary>
              <AdminBlogList />
            </RouteErrorBoundary>
          )}
        </Route>
        <Route path="/admin/blog/new">
          {() => (
            <RouteErrorBoundary>
              <AdminBlogEdit />
            </RouteErrorBoundary>
          )}
        </Route>
        <Route path="/admin/blog/edit">
          {() => (
            <RouteErrorBoundary>
              <AdminBlogEdit />
            </RouteErrorBoundary>
          )}
        </Route>
        <Route path="/admin/blog/edit/:id">
          {() => (
            <RouteErrorBoundary>
              <AdminBlogEdit />
            </RouteErrorBoundary>
          )}
        </Route>
        <Route path="/admin/video">
          {() => (
            <RouteErrorBoundary>
              <AdminVideoList />
            </RouteErrorBoundary>
          )}
        </Route>
        <Route path="/admin/video/new">
          {() => (
            <RouteErrorBoundary>
              <AdminVideoEdit />
            </RouteErrorBoundary>
          )}
        </Route>
        <Route path="/admin/video/edit/:id">
          {() => (
            <RouteErrorBoundary>
              <AdminVideoEdit />
            </RouteErrorBoundary>
          )}
        </Route>
        <Route path="/admin/photo">
          {() => (
            <RouteErrorBoundary>
              <AdminPhotoList />
            </RouteErrorBoundary>
          )}
        </Route>
        <Route path="/admin/photo/new">
          {() => (
            <RouteErrorBoundary>
              <AdminPhotoEdit />
            </RouteErrorBoundary>
          )}
        </Route>
        <Route path="/admin/photo/edit/:id">
          {() => (
            <RouteErrorBoundary>
              <AdminPhotoEdit />
            </RouteErrorBoundary>
          )}
        </Route>
        <Route path="/admin/category">
          {() => (
            <RouteErrorBoundary>
              <AdminCategoryList />
            </RouteErrorBoundary>
          )}
        </Route>
        <Route path="/admin/category/new">
          {() => (
            <RouteErrorBoundary>
              <AdminCategoryEdit />
            </RouteErrorBoundary>
          )}
        </Route>
        <Route path="/admin/category/edit/:id">
          {() => (
            <RouteErrorBoundary>
              <AdminCategoryEdit />
            </RouteErrorBoundary>
          )}
        </Route>
        <Route path="/admin/destinations">
          {() => (
            <RouteErrorBoundary>
              <AdminDestinationList />
            </RouteErrorBoundary>
          )}
        </Route>
        <Route path="/admin/destinations/new">
          {() => (
            <RouteErrorBoundary>
              <AdminDestinationEdit />
            </RouteErrorBoundary>
          )}
        </Route>
        <Route path="/admin/destinations/:id">
          {() => (
            <RouteErrorBoundary>
              <AdminDestinationEdit />
            </RouteErrorBoundary>
          )}
        </Route>
        <Route path="/admin/comments">
          {() => (
            <RouteErrorBoundary>
              <AdminCommentModeration />
            </RouteErrorBoundary>
          )}
        </Route>
        <Route path="/admin/calendar">
          {() => (
            <RouteErrorBoundary>
              <AdminContentCalendar />
            </RouteErrorBoundary>
          )}
        </Route>
      </Suspense>
      <Route path="/login">
        {() => (
          <RouteErrorBoundary>
            <Login />
          </RouteErrorBoundary>
        )}
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
