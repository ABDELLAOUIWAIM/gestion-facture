import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import UploadPage from './pages/UploadPage';
import InvoicesPage from './pages/InvoicesPage';
import DuplicatesPage from './pages/DuplicatesPage';
import InvoiceDetailsPage from './pages/InvoiceDetailsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/invoices" replace />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="duplicates" element={<DuplicatesPage />} />
            <Route path="invoice/:id" element={<InvoiceDetailsPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;