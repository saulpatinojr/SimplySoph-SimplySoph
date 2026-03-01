import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Videos from "./pages/Videos";
import Photos from "./pages/Photos";
import PhotoAlbum from "./pages/PhotoAlbum";
import Passport from "./pages/Passport";
import DestinationPage from "./pages/Destination";
import About from "./pages/About";
import Contact from "./pages/Contact";
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
      <Route path={"/"} component={Home} />
      <Route path={"/blog"} component={Blog} />
      <Route path={"/blog/:slug"} component={BlogPost} />
      <Route path={"/videos"} component={Videos} />
      <Route path={"/photos"} component={Photos} />
      <Route path={"/photos/:slug"} component={PhotoAlbum} />
      <Route path={"/passport"} component={Passport} />
      <Route path={"/passport/:slug"} component={DestinationPage} />
      <Route path={"/about"} component={About} />
      <Route path={"/contact"} component={Contact} />
      <Route path={"/privacy-policy"} component={PrivacyPolicy} />
      <Route path={"/terms-of-service"} component={TermsOfService} />
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
        <Route path={"/admin"} component={AdminDashboard} />
        <Route path={"/admin/blog"} component={AdminBlogList} />
        <Route path={"/admin/blog/new"} component={AdminBlogEdit} />
        <Route path={"/admin/blog/edit"} component={AdminBlogEdit} />
        <Route path={"/admin/blog/edit/:id"} component={AdminBlogEdit} />
        <Route path={"/admin/video"} component={AdminVideoList} />
        <Route path={"/admin/video/new"} component={AdminVideoEdit} />
        <Route path={"/admin/video/edit/:id"} component={AdminVideoEdit} />
        <Route path={"/admin/photo"} component={AdminPhotoList} />
        <Route path={"/admin/photo/new"} component={AdminPhotoEdit} />
        <Route path={"/admin/photo/edit/:id"} component={AdminPhotoEdit} />
        <Route path={"/admin/category"} component={AdminCategoryList} />
        <Route path={"/admin/category/new"} component={AdminCategoryEdit} />
        <Route
          path={"/admin/category/edit/:id"}
          component={AdminCategoryEdit}
        />
        <Route path={"/admin/destinations"} component={AdminDestinationList} />
        <Route
          path={"/admin/destinations/new"}
          component={AdminDestinationEdit}
        />
        <Route
          path={"/admin/destinations/:id"}
          component={AdminDestinationEdit}
        />
        <Route path={"/admin/comments"} component={AdminCommentModeration} />
        <Route path={"/admin/calendar"} component={AdminContentCalendar} />
      </Suspense>
      <Route path={"/login"} component={Login} />
      <Route path={"/404"} component={NotFound} />
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
