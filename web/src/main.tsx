import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Layout } from '@/components/Layout';
import { IssuesPage } from '@/pages/IssuesPage';
import { IssueDetailPage } from '@/pages/IssueDetailPage';
import { ReadyPage } from '@/pages/ReadyPage';
import { BoardPage } from '@/pages/BoardPage';
import { GraphPage } from '@/pages/GraphPage';
import './index.css';

function App() {
  // Connect to WebSocket for real-time updates
  useWebSocket();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<IssuesPage />} />
          <Route path="issue/:id" element={<IssueDetailPage />} />
          <Route path="ready" element={<ReadyPage />} />
          <Route path="board" element={<BoardPage />} />
          <Route path="graph" element={<GraphPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
