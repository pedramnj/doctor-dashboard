import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';

const RequestsManagement = () => {
  const [requests, setRequests] = useState([]);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogData, setDialogData] = useState({
    patientId: '',
    medicationId: '',
    isApproval: false,
    message: ''
  });

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

  const handleRequest = async () => {
    const { patientId, medicationId, isApproval, message } = dialogData;
    
    if (!message.trim()) {
      setAlert({
        type: 'error',
        title: 'Error',
        message: 'Please enter a message'
      });
      return;
    }

    try {
      const docRef = doc(db, patientId, medicationId);
      const docSnap = await getDoc(docRef);
      const currentData = docSnap.data();
      
      const updateData = {
        PendingRequest: {
          KnowledgeLevel: currentData.PendingRequest.KnowledgeLevel,
          Status: isApproval ? 'Accepted' : 'Denied',
          Message: message.trim()
        }
      };

      if (isApproval) {
        updateData.KnowledgeLevel = currentData.PendingRequest.KnowledgeLevel;
      }

      await updateDoc(docRef, updateData);

      setAlert({
        type: 'success',
        title: 'Success',
        message: `Request ${isApproval ? 'approved' : 'denied'} successfully`
      });

      setShowDialog(false);
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

  const openDialog = (patientId, medicationId, isApproval) => {
    setDialogData({
      patientId,
      medicationId,
      isApproval,
      message: ''
    });
    setShowDialog(true);
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
                      onClick={() => openDialog(request.patientId, request.medicationId, true)}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => openDialog(request.patientId, request.medicationId, false)}
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogData.isApproval ? 'Approve Request' : 'Deny Request'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message to Patient
            </label>
            <Textarea
              value={dialogData.message}
              onChange={(e) => setDialogData({ ...dialogData, message: e.target.value })}
              placeholder="Enter your message to the patient..."
              className="w-full"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequest}
              variant={dialogData.isApproval ? "default" : "destructive"}
            >
              {dialogData.isApproval ? 'Approve' : 'Deny'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestsManagement;