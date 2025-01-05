import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, setDoc, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const AddPatient = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableDrugs, setAvailableDrugs] = useState([]);
  
  // Form states
  const [userCode, setUserCode] = useState('');
  const [fiscalCode, setFiscalCode] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [medications, setMedications] = useState([{
    drugId: '',
    dosage: '',
    modality: '',
    doseTimes: [''],
    knowledgeLevel: 'Basic'
  }]);

  // Fetch available drugs from DrugsList
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
    if (!userCode || !fiscalCode || !secretCode) {
      setError('Please fill in all required fields');
      return;
    }

    if (!medications[0].drugId) {
      setError('Please select at least one medication');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create user document
      await setDoc(doc(db, 'users', userCode), {
        fiscalCode,
        secretCode,
        createdAt: new Date()
      });

      // Add medications for the user
      for (const medication of medications) {
        // Get reference to existing drug
        const drugRef = doc(db, 'DrugsList', medication.drugId);

        // Create medication in user's collection
        await setDoc(doc(db, userCode, medication.drugId), {
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
          DoseTimes: medication.doseTimes.filter(time => time !== '')
        });
      }

      navigate('/');
    } catch (err) {
      console.error('Error adding patient:', err);
      setError('Failed to add patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-6">Add New Patient</h1>

          {error && (
            <Alert className="mb-4 bg-red-100 border-red-500">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>User Code (e.g., User1, User2)</Label>
              <Input
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                placeholder="Enter user code"
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Codice Fiscale</Label>
                <Input
                  value={fiscalCode}
                  onChange={(e) => setFiscalCode(e.target.value)}
                  placeholder="Enter codice fiscale"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Secret Code</Label>
                <Input
                  type="password"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  placeholder="Enter secret code"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Medications</h2>
                <Button type="button" onClick={addMedication} variant="outline">
                  Add Medication
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
                        <Label>Dosage</Label>
                        <Input
                          value={medication.dosage}
                          onChange={(e) => handleMedicationChange(medIndex, 'dosage', e.target.value)}
                          placeholder="Enter dosage"
                        />
                      </div>
                      <div>
                        <Label>Modality</Label>
                        <Input
                          value={medication.modality}
                          onChange={(e) => handleMedicationChange(medIndex, 'modality', e.target.value)}
                          placeholder="Enter modality"
                        />
                      </div>
                      <div>
                        <Label>Initial Knowledge Level</Label>
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

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                onClick={() => navigate('/')}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Patient'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddPatient;