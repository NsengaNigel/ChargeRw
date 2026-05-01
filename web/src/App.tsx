import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MapPage from './pages/MapPage';
import StationDetailPage from './pages/StationDetailPage';
import PaymentPage from './pages/PaymentPage';
import ActiveSessionPage from './pages/ActiveSessionPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/stations/:id" element={<StationDetailPage />} />
        <Route path="/stations/:id/pay" element={<PaymentPage />} />
        <Route path="/sessions/:id" element={<ActiveSessionPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
