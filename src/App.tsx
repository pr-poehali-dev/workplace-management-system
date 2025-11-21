
import { useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'manager' | 'employee';
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {!currentUser ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <DashboardPage user={currentUser} onLogout={handleLogout} />
      )}
      <Toaster />
    </div>
  );
}

export default App;