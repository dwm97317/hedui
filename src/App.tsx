import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import MainApp from './pages/MainApp';
import AdminDashboard from './pages/AdminDashboard';
import Debugger from './components/Debugger';
import './index.css';

export default function App() {
    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#8b5cf6', // Vivid Purple
                    borderRadius: 12,
                    fontFamily: 'var(--font-main)',
                }
            }}
        >
            <Debugger />
            <Router>
                <Routes>
                    <Route path="/" element={<MainApp />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                </Routes>
            </Router>
        </ConfigProvider>
    );
}
