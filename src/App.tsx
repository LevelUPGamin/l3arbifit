import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Public pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ArticleDetail from "./pages/ArticleDetail";
import Category from "./pages/Category";
import Search from "./pages/Search";
import Bookmarks from "./pages/Bookmarks";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Archive from "./pages/Archive";
import Author from "./pages/Author";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";

// Admin pages
import Dashboard from "./pages/admin/Dashboard";
import Pages from "./pages/admin/Pages";
import PageEditor from "./pages/admin/PageEditor";
import ArticlesList from "./pages/admin/ArticlesList";
import ArticleEditor from "./pages/admin/ArticleEditor";
import UsersList from "./pages/admin/UsersList";
import Logs from "./pages/admin/Logs";
import Settings from "./pages/admin/Settings";
import Categories from "./pages/admin/Categories";
import Messages from "./pages/admin/Messages";
import Subscribers from "./pages/admin/Subscribers";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/article/:slug" element={<ArticleDetail />} />
              <Route path="/category/:slug" element={<Category />} />
              <Route path="/search" element={<Search />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/archive" element={<Archive />} />
              <Route path="/author/:id" element={<Author />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Admin routes */}
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/articles" element={<ArticlesList />} />
              <Route path="/admin/pages" element={<Pages />} />
              <Route path="/admin/pages/:slug" element={<PageEditor />} />
              <Route path="/admin/articles/:id" element={<ArticleEditor />} />
              <Route path="/admin/categories" element={<Categories />} />
              <Route path="/admin/users" element={<UsersList />} />
              <Route path="/admin/messages" element={<Messages />} />
              <Route path="/admin/subscribers" element={<Subscribers />} />
              <Route path="/admin/logs" element={<Logs />} />
              <Route path="/admin/settings" element={<Settings />} />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;