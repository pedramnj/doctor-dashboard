import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';

const RequestsManagement = () => {
  const [requests, setRequests] = useState([]);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const allRequests = [];
      
      // Get all users
      const usersSnapshot = await getDocs(collection(db, 'users'));

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        // Get all medications for this user
        const medicationsSnapshot = await getDocs(collection(db, userId));
        
        for (const medDoc of medicationsSnapshot.docs) {
          const med = medDoc.data();
          // Check if there's a pending request
          if (med.PendingRequest?.Status === 'Pending') {
            allRequests.push({
              patientId: userId,
              patientName: userId,
              medicationId: medDoc.id,
              medicationName: med.DrugTitle || medDoc.id,
              requestedLevel: med.PendingRequest.KnowledgeLevel,
              currentLevel: med.KnowledgeLevel
            });
          }
        }
      }

      setRequests(allRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch requests'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (patientId, medicationId, approved, message = '') => {
    try {
      const docRef = doc(db, patientId, medicationId);
      
      // Get current document
      const docSnap = await getDoc(docRef);
      const currentData = docSnap.data();
      
      // Create the exact structure for PendingRequest
      const updateData = {
        PendingRequest: {
          KnowledgeLevel: currentData.PendingRequest.KnowledgeLevel,
          Status: approved ? 'Accepted' : 'Denied',
          Message: approved 
            ? 'Your request for changing the knowledge level has been accepted.'
            : message
        }
      };

      // If approved, also update the main knowledge level
      if (approved) {
        updateData.KnowledgeLevel = currentData.PendingRequest.KnowledgeLevel;
      }

      // Update document
      await updateDoc(docRef, updateData);

      setAlert({
        type: 'success',
        title: 'Success',
        message: `Request ${approved ? 'approved' : 'denied'} successfully`
      });

      // Refresh the requests list
      fetchRequests();
    } catch (error) {
      console.error('Error processing request:', error);
      setAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to process request'
      });
    }
  };

  const handleApprove = (patientId, medicationId) => {
    handleRequest(patientId, medicationId, true);
  };

  const handleDeny = (patientId, medicationId) => {
    const message = prompt('Please enter denial reason:');
    if (message?.trim()) {
      handleRequest(patientId, medicationId, false, message.trim());
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-gray-600">Loading requests...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Knowledge Level Requests</h1>

      {alert && (
        <Alert 
          className={`mb-4 ${
            alert.type === 'error' ? 'bg-red-100' : 'bg-green-100'
          }`}
        >
          <AlertTitle>{alert.title}</AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
          No pending requests found.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Patient ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Medication
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Current Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Requested Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={`${request.patientId}-${request.medicationId}`}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {request.patientId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {request.medicationName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100">
                      {request.currentLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {request.requestedLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    <button
                      onClick={() => handleApprove(request.patientId, request.medicationId)}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleDeny(request.patientId, request.medicationId)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                    >
                      Deny
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RequestsManagement;