import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './hooks/useTheme'
import AppShell from './components/layout/AppShell'
import ModulesPage from './pages/ModulesPage'
import ExecutiveSummaryPage from './pages/ExecutiveSummaryPage'
import PipelineInsightsPage from './pages/PipelineInsightsPage'
import FinancialInsightsPage from './pages/FinancialInsightsPage'
import ArticlePage from './pages/ArticlePage'
import NewsArticlePage from './pages/NewsArticlePage'
import AccountsListPage from './pages/accounts/AccountsListPage'
import AccountPlanningPage from './pages/accounts/AccountPlanningPage'
import ExecCapitalPage from './pages/accounts/ExecCapitalPage'
import ExecDetailPage from './pages/accounts/ExecDetailPage'
import AccountInfoPage from './pages/accounts/AccountInfoPage'
import ExecutiveBriefingPresentation from './pages/accounts/ExecutiveBriefingPresentation'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<Navigate to="/modules" replace />} />
            <Route path="modules" element={<ModulesPage />} />
            <Route path="executive-summary" element={<ExecutiveSummaryPage />} />
            <Route path="executive-summary/pipeline-insights" element={<PipelineInsightsPage />} />
            <Route path="executive-summary/financial-insights" element={<FinancialInsightsPage />} />
            <Route path="executive-summary/article/:type" element={<ArticlePage />} />
            <Route path="executive-summary/news/:id" element={<NewsArticlePage />} />
            <Route path="accounts" element={<AccountsListPage />} />
            <Route path="accounts/planning" element={<AccountPlanningPage />} />
            <Route path="accounts/exec-capital" element={<ExecCapitalPage />} />
            <Route path="accounts/exec-capital/:id" element={<ExecDetailPage />} />
            <Route path="accounts/:id" element={<AccountInfoPage />} />
          </Route>
          {/* Standalone presentation page (no shell) */}
          <Route path="/briefing/:accountId" element={<ExecutiveBriefingPresentation />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
