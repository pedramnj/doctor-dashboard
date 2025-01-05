import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const AddMedicineModal = ({ isOpen, onClose, onAdd, patientId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableDrugs, setAvailableDrugs] = useState([]);
  const [medications, setMedications] = useState([{
    drugId: '',
    dosage: '',
    modality: '',
    doseTimes: [''],
    knowledgeLevel: 'Basic'
  }]);

  useEffect(() => {
    const fetchDrugs = async () => {
      try {
        const drugsSnapshot = await getDocs(collection(db, 'DrugsList'));
        const drugs = drugsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAvailableDrugs(drugs);
      } catch (error) {
        console.error('Error fetching drugs:', error);
        setError('Failed to load available medications');
      }
    };

    fetchDrugs();
  }, []);

  const handleAddDoseTime = (medIndex) => {
    const updatedMeds = [...medications];
    updatedMeds[medIndex].doseTimes.push('');
    setMedications(updatedMeds);
  };

  const handleDoseTimeChange = (medIndex, timeIndex, value) => {
    const updatedMeds = [...medications];
    updatedMeds[medIndex].doseTimes[timeIndex] = value;
    setMedications(updatedMeds);
  };

  const handleMedicationChange = (index, field, value) => {
    const updatedMeds = [...medications];
    updatedMeds[index][field] = value;
    setMedications(updatedMeds);
  };

  const addMedication = () => {
    setMedications([...medications, {
      drugId: '',
      dosage: '',
      modality: '',
      doseTimes: [''],
      knowledgeLevel: 'Basic'
    }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!medications[0].drugId) {
      setError('Please select at least one medication');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Add medications for the user
      for (const medication of medications) {
        const drugRef = doc(db, 'DrugsList', medication.drugId);

        await setDoc(doc(db, patientId, medication.drugId), {
          DrugTitle: availableDrugs.find(d => d.id === medication.drugId)?.DrugTitle || medication.drugId,
          DetailsRecap: {
            Dosage: medication.dosage,
            Modality: medication.modality
          },
          DrugReference: drugRef,
          KnowledgeLevel: medication.knowledgeLevel,
          PendingRequest: {
            KnowledgeLevel: '',
            Status: '',
            Message: ''
          },
          doseTimes: medication.doseTimes.filter(time => time !== '')
        });
      }

      onAdd();
      onClose();
    } catch (error) {
      console.error('Error adding medications:', error);
      setError('Failed to add medications');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-3xl my-8">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Add New Medications</h2>
            <Button 
              onClick={onClose}
              variant="ghost"
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </Button>
          </div>

          {error && (
            <Alert className="mb-4 bg-red-100 border-red-500">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Medications</h2>
                <Button type="button" onClick={addMedication} variant="outline">
                  Add Another Medication
                </Button>
              </div>

              {medications.map((medication, medIndex) => (
                <Card key={medIndex}>
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Medication</Label>
                        <Select 
                          value={medication.drugId}
                          onValueChange={(value) => handleMedicationChange(medIndex, 'drugId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select medication" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableDrugs.map(drug => (
                              <SelectItem key={drug.id} value={drug.id}>
                                {drug.DrugTitle}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Dosage (mg)</Label>
                        <Input
                          value={medication.dosage}
                          onChange={(e) => handleMedicationChange(medIndex, 'dosage', e.target.value)}
                          placeholder="Enter dosage"
                        />
                      </div>
                      <div>
                        <Label>Modality</Label>
                        <Select 
                          value={medication.modality}
                          onValueChange={(value) => handleMedicationChange(medIndex, 'modality', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select modality" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Oral">Oral</SelectItem>
                            <SelectItem value="Injection">Injection</SelectItem>
                            <SelectItem value="Topical">Topical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Knowledge Level</Label>
                        <Select 
                          value={medication.knowledgeLevel}
                          onValueChange={(value) => handleMedicationChange(medIndex, 'knowledgeLevel', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Basic">Basic</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Dose Times</Label>
                      {medication.doseTimes.map((time, timeIndex) => (
                        <div key={timeIndex} className="mt-2 flex gap-2">
                          <Input
                            type="time"
                            value={time}
                            onChange={(e) => handleDoseTimeChange(medIndex, timeIndex, e.target.value)}
                          />
                          {timeIndex === medication.doseTimes.length - 1 && (
                            <Button 
                              type="button"
                              onClick={() => handleAddDoseTime(medIndex)}
                              variant="outline"
                            >
                              Add Time
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button 
                type="button" 
                onClick={onClose}
                variant="outline"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Medications'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const PatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedPatient, setEditedPatient] = useState(null);
  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', patientId));
      
      if (!userDoc.exists()) {
        setError('Patient not found');
        return;
      }

      const userData = {
        id: userDoc.id,
        ...userDoc.data()
      };
      
      setPatient(userData);
      setEditedPatient(userData);

      const medicationsSnapshot = await getDocs(collection(db, patientId));
      const medicationsData = [];

      for (const doc of medicationsSnapshot.docs) {
        const medData = doc.data();
        
        if (medData.DrugReference) {
          const drugDoc = await getDoc(medData.DrugReference);
          if (drugDoc.exists()) {
            medicationsData.push({
              id: doc.id,
              ...medData,
              Details: drugDoc.data().Details
            });
          }
        } else {
          medicationsData.push({
            id: doc.id,
            ...medData
          });
        }
      }
      
      setMedications(medicationsData);
    } catch (err) {
      console.error('Error fetching patient data:', err);
      setError('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPatient = () => {
    setEditMode(true);
  };

  const handleSavePatient = async () => {
    try {
      setLoading(true);
      await updateDoc(doc(db, 'users', patientId), {
        fiscalCode: editedPatient.fiscalCode,
        secretCode: editedPatient.secretCode
      });
      
      setPatient(editedPatient);
      setEditMode(false);
    } catch (err) {
      console.error('Error updating patient:', err);
      setError('Failed to update patient details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePatient = async () => {
    if (window.confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
      try {
        setLoading(true);
        
        for (const medication of medications) {
          await deleteDoc(doc(db, patientId, medication.id));
        }
        
        await deleteDoc(doc(db, 'users', patientId));
        
        navigate('/');
      } catch (err) {
        console.error('Error deleting patient:', err);
        setError('Failed to delete patient');
        setLoading(false);
      }
    }
  };

  const handleEditMedication = async (medicationId, field, value) => {
    try {
      setLoading(true);
      if (field === 'dosage') {
        await updateDoc(doc(db, patientId, medicationId), {
          'DetailsRecap.Dosage': value
        });
      } else if (field === 'modality') {
        await updateDoc(doc(db, patientId, medicationId), {
          'DetailsRecap.Modality': value
        });
      }
      
      fetchPatientData();
    } catch (err) {
      console.error('Error updating medication:', err);
      setError('Failed to update medication');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <Alert className="m-4 bg-red-100 border-red-500">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Patient Details - {patientId}</h1>
            <div className="space-x-2">
              <Button
                onClick={() => setShowAddMedicineModal(true)}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                Add Medicine
              </Button>
              {editMode ? (
                <Button
                  onClick={handleSavePatient}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  Save Changes
                </Button>
              ) : (
                <Button
                  onClick={handleEditPatient}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Edit Patient
                </Button>
              )}
              <Button
                onClick={handleDeletePatient}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Delete Patient
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <Label>Patient ID</Label>
                  <p className="mt-1">{patient?.id}</p>
                </div>
                <div>
                  <Label>Fiscal Code</Label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={editedPatient?.fiscalCode || ''}
                      onChange={(e) => setEditedPatient(prev => ({ ...prev, fiscalCode: e.target.value }))}
                      className="mt-1 block w-full"
                    />
                  ) : (
                    <p className="mt-1">{patient?.fiscalCode}</p>
                  )}
                </div>
                <div>
                  <Label>Secret Code</Label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={editedPatient?.secretCode || ''}
                      onChange={(e) => setEditedPatient(prev => ({ ...prev, secretCode: e.target.value }))}
                      className="mt-1 block w-full"
                    />
                  ) : (
                    <p className="mt-1">••••••</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Account Status</h2>
              <div className="space-y-4">
                <div>
                  <Label>Created At</Label>
                  <p className="mt-1">
                    {patient?.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label>Total Medications</Label>
                  <p className="mt-1">{medications.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Medications</h2>
            <div className="space-y-4">
              {medications.map((medication) => (
                <Card key={medication.id} className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-medium">{medication.DrugTitle || medication.id}</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Dosage</Label>
                          <div className="flex items-center gap-2">
                            <p>{medication.DetailsRecap?.Dosage || 'N/A'} {medication.DetailsRecap?.Dosage ? 'mg' : ''}</p>
                            <Button
                              onClick={() => {
                                const newDosage = prompt('Enter new dosage (mg):', medication.DetailsRecap?.Dosage);
                                if (newDosage) handleEditMedication(medication.id, 'dosage', newDosage);
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Edit
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label>Modality</Label>
                          <div className="flex items-center gap-2">
                            <p>{medication.DetailsRecap?.Modality || 'N/A'}</p>
                            <Button
                              onClick={() => {
                                const newModality = prompt('Enter new modality:', medication.DetailsRecap?.Modality);
                                if (newModality) handleEditMedication(medication.id, 'modality', newModality);
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Edit
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label>Knowledge Level</Label>
                          <p>{medication.KnowledgeLevel || 'Basic'}</p>
                        </div>

                        <div>
                          <Label>Dose Times</Label>
                          <p>{medication.doseTime?.length > 0 ? medication.doseTime.join(', ') : 'N/A'}</p>
                          </div>
                      </div>

                      {medication.PendingRequest?.Status === 'Pending' && (
                        <div className="mt-4 p-3 bg-yellow-50 rounded-md border border-yellow-200">
                          <h4 className="text-sm font-medium text-yellow-800">Pending Request</h4>
                          <p className="text-sm text-yellow-600">
                            Requesting {medication.PendingRequest.KnowledgeLevel} level access
                          </p>
                        </div>
                      )}

                      {/* Medication Content Sections */}
                      <div className="mt-4 space-y-4">
                        {['Basic', 'Intermediate', 'Expert'].map((level) => (
                          <div key={level}>
                            <h4 className="text-sm font-medium text-gray-600">{level} Level Content</h4>
                            <p className="mt-1 text-sm text-gray-500">
                              {medication.Details?.[level]?.[0]?.Content?.[0] || 'No content available'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {medications.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No medications found for this patient.
                </div>
              )}
            </div>
          </div>

          {/* Back to Dashboard Button */}
          <div className="flex justify-end mt-6">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
            >
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Medicine Modal */}
      <AddMedicineModal
        isOpen={showAddMedicineModal}
        onClose={() => setShowAddMedicineModal(false)}
        onAdd={fetchPatientData}
        patientId={patientId}
      />
    </div>
  );
};

export default PatientDetails;