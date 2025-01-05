// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DoctorAuthProvider } from './context/DoctorAuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PatientDetails from './pages/PatientDetails';
import RequestsManagement from './pages/RequestsManagement';
import AddPatient from './pages/AddPatient';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

function App() {
  return (
    <DoctorAuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <div>
                    <Navbar />
                    <Dashboard />
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/patient/:patientId"
              element={
                <PrivateRoute>
                  <div>
                    <Navbar />
                    <PatientDetails />
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/requests"
              element={
                <PrivateRoute>
                  <div>
                    <Navbar />
                    <RequestsManagement />
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/add-patient"
              element={
                <PrivateRoute>
                  <div>
                    <Navbar />
                    <AddPatient />
                  </div>
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </DoctorAuthProvider>
  );
}

export default App;