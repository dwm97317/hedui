import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import MainApp from './pages/MainApp';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

export default function App() {
    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#d8b4fe', // Light Purple
                    colorBgBase: '#120f16',
                    colorTextBase: '#f3e8ff',
                },
                algorithm: theme.darkAlgorithm,
            }}
        >
            <Router>
                <Routes>
                    <Route path="/" element={<MainApp />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                </Routes>
            </Router>
        </ConfigProvider>
    );
}
