import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme";
import { LanguageProvider } from "@/i18n";
import { StudioLayout } from "@/components/StudioLayout";
import HomePage from "@/pages/HomePage";
import WorkspacePage from "@/pages/WorkspacePage";
import CreatePage from "@/pages/CreatePage";
import ProgressPage from "@/pages/ProgressPage";
import ResultPage from "@/pages/ResultPage";
import LibraryPage from "@/pages/LibraryPage";
import BoardsPage from "@/pages/BoardsPage";
import BoardDetailPage from "@/pages/BoardDetailPage";
import AssetsPage from "@/pages/AssetsPage";
import AccountPage from "@/pages/AccountPage";
import SettingsPage from "@/pages/SettingsPage";
import PricingPage from "@/pages/PricingPage";
import AcademyPage from "@/pages/AcademyPage";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminContentEditor from "@/pages/admin/AdminContentEditor";
import AdminPricing from "@/pages/admin/AdminPricing";
import AdminModels from "@/pages/admin/AdminModels";
import AdminFeatures from "@/pages/admin/AdminFeatures";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminLogs from "@/pages/admin/AdminLogs";
import LegalLayout from "@/pages/legal/LegalLayout";
import TermsPage from "@/pages/legal/TermsPage";
import PrivacyPage from "@/pages/legal/PrivacyPage";
import RefundPage from "@/pages/legal/RefundPage";
import ContentPolicyPage from "@/pages/legal/ContentPolicyPage";
import CookiesPage from "@/pages/legal/CookiesPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark">
      <LanguageProvider defaultLanguage="ru">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route element={<StudioLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/studio" element={<WorkspacePage />} />
                <Route path="/create" element={<CreatePage />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/result/:id" element={<ResultPage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/boards" element={<BoardsPage />} />
                <Route path="/boards/:boardId" element={<BoardDetailPage />} />
                <Route path="/assets" element={<AssetsPage />} />
                <Route path="/academy" element={<AcademyPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="content" element={<AdminContentEditor />} />
                  <Route path="pricing" element={<AdminPricing />} />
                  <Route path="models" element={<AdminModels />} />
                  <Route path="features" element={<AdminFeatures />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="logs" element={<AdminLogs />} />
                </Route>
                <Route path="/legal" element={<LegalLayout />}>
                  <Route path="terms" element={<TermsPage />} />
                  <Route path="privacy" element={<PrivacyPage />} />
                  <Route path="refund" element={<RefundPage />} />
                  <Route path="content" element={<ContentPolicyPage />} />
                  <Route path="cookies" element={<CookiesPage />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
