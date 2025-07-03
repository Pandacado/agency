import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { Notes } from './pages/Notes';
import { Meetings } from './pages/Meetings';
import { Tasks } from './pages/Tasks';
import { Proposals } from './pages/Proposals';
import { Expenses } from './pages/Expenses';
import { Admin } from './pages/Admin';
import { Layout } from './components/Layout';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors font-inter">
            <Toaster 
              position="top-right"
              toastOptions={{
                className: 'dark:bg-gray-800 dark:text-white',
                duration: 4000,
                style: {
                  borderRadius: '12px',
                  fontFamily: 'Inter, sans-serif'
                }
              }}
            />
            
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/customers/:id/notes" element={<Notes />} />
                <Route path="/meetings" element={<Meetings />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/proposals" element={<Proposals />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/admin" element={<Admin />} />
              </Route>
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;