import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import SetClassroomLocation from './pages/SetClassroomLocation';
import MarkAttendance from './pages/MarkAttendance';

const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to={`/login?redirect=${location.pathname}${location.search}`} />;
  if (role && user.role !== role) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/set-classroom" element={<SetClassroomLocation />} />
          <Route path="/mark-attendance" element={<MarkAttendance />} />
          <Route path="/login" element={<Login />} />
          <Route path="/student" element={
            <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>
          } />
          <Route path="/teacher" element={
            <ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;