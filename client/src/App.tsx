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
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
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

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/blog"} component={Blog} />
      <Route path={"/blog/:slug"} component={BlogPost} />
      <Route path={"/videos"} component={Videos} />
      <Route path={"/photos"} component={Photos} />
      <Route path={"/about"} component={About} />
      <Route path={"/contact"} component={Contact} />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }>
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
        <Route path={"/admin/category/edit/:id"} component={AdminCategoryEdit} />
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
