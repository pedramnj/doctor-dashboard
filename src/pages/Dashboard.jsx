import React, { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { useDoctorAuth } from '../context/DoctorAuthContext';

const Dashboard = () => {
  const [patients, setPatients] = useState([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const { doctor } = useDoctorAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all users from 'users' collection
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const patientsData = [];
        let pendingCount = 0;

        for (const userDoc of usersSnapshot.docs) {
          const userId = userDoc.id;
          const userData = userDoc.data();
          
          // Fetch medications for this user
          const medicationsSnapshot = await getDocs(collection(db, userId));
          
          // Count pending requests
          medicationsSnapshot.forEach(medDoc => {
            const med = medDoc.data();
            if (med.PendingRequest?.Status === 'Pending') {
              pendingCount++;
            }
          });

          // Add user to patients list with their details
          patientsData.push({
            id: userId,
            fiscalCode: userData.fiscalCode,
            name: userId, // Using userId as name since it's User1, User2, etc.
            createdAt: userData.createdAt,
            medicationCount: medicationsSnapshot.size
          });
        }

        // Sort patients by creation date (newest first)
        patientsData.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.toDate() - a.createdAt.toDate();
          }
          return 0;
        });

        setPatients(patientsData);
        setPendingRequests(pendingCount);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
        <Link 
          to="/add-patient"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add New Patient
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Total Patients</h2>
          <p className="text-3xl text-blue-600">{patients.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Pending Requests</h2>
          <p className="text-3xl text-yellow-600">{pendingRequests}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Patient ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fiscal Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Medications
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {patients.map((patient) => (
              <tr key={patient.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  {patient.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {patient.fiscalCode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {patient.medicationCount} medications
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {patient.createdAt ? patient.createdAt.toDate().toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    to={`/patient/${patient.id}`}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
            {patients.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No patients found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;