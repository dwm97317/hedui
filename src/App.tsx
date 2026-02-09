import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainApp from './pages/MainApp';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainApp />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Routes>
        </Router>
    );
}
