import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { useAuth } from "./context/AuthContext";
import Dashboard from "./views/Dashboard";
import EmployeeList from "./views/EmployeeList";
import LeaveTracker from "./views/LeaveTracker";
import SignIn from "./views/SignIn";

function ProtectedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-mist md:flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0 flex-1">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<EmployeeList />} />
            <Route path="/leaves" element={<LeaveTracker />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { initializing, isAuthenticated } = useAuth();
  if (initializing) {
    return <div className="flex min-h-screen items-center justify-center bg-mist text-ink/70">Loading workspace...</div>;
  }
  return isAuthenticated ? children : <Navigate to="/signin" replace />;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={isAuthenticated ? <Navigate to="/" replace /> : <SignIn />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <ProtectedLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
