import React, { useEffect,useState } from 'react';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import { Package } from 'lucide-react';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';
import { storage } from '../../Firebase';

const Summary = ({ 
  drug, 
  userDrugData, 
  knowledgeLevel, 
  setKnowledgeLevel,  
  highestApprovedLevel,
  focusKey 
}) => {
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestedLevel, setRequestedLevel] = useState(null);

  const { ref, focusSelf, focused } = useFocusable({
    focusKey,
  });

  const getLevelValue = (level) => {
    const levels = { basic: 1, intermediate: 2, expert: 3 };
    return levels[level.toLowerCase()] || 1;
  };

  const handleLevelSelect = (newLevel) => {
    const newLevelValue = getLevelValue(newLevel);
    const highestApprovedValue = getLevelValue(highestApprovedLevel);

    if (newLevelValue <= highestApprovedValue) {
      // Can directly change
      setKnowledgeLevel(newLevel);  // Updated to use setKnowledgeLevel
    } else {
      // Show confirmation dialog for higher levels
      setRequestedLevel(newLevel);
      setShowRequestDialog(true);
    }
  };

  const handleConfirmRequest = () => {
    if (requestedLevel) {
      setKnowledgeLevel(requestedLevel);  // Updated to use setKnowledgeLevel
      setShowRequestDialog(false);
      setRequestedLevel(null);
    }
  };


  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        onFocus={focusSelf}
        className="flex flex-col space-y-6"
      >
        {/* Main content layout */}
        <div className="flex justify-between items-start gap-6">
          <DrugContent drug={drug} focusKey={`${focusKey}-content`} />
          
          <div className="flex-shrink-0">
            <div className="flex flex-col items-center space-y-4">
              <h3 className="text-xl font-bold text-white">{drug.DrugTitle}</h3>
              <KnowledgeLevelDropdown
  currentLevel={knowledgeLevel}
  onLevelChange={handleLevelSelect}  // This stays the same
  pendingRequest={userDrugData.PendingRequest}
  highestApprovedLevel={highestApprovedLevel}
  focusKey={`${focusKey}-dropdown`}
/>
            </div>
          </div>
          
          <DrugCard
            drug={drug}
            userDrugData={userDrugData}
            focusKey={`${focusKey}-card`}
          />
        </div>

        {/* Confirmation Dialog */}
        {showRequestDialog && requestedLevel && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg text-white max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Request Knowledge Level Upgrade</h3>
              <p className="mb-6">
                Are you sure you want to request {requestedLevel} level access?
                This request will need to be approved by your doctor.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowRequestDialog(false)}
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRequest}
                  className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 transition-colors"
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {userDrugData.PendingRequest?.Status === 'Pending' && (
          <div className="p-4 bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <p>
                Pending request for {userDrugData.PendingRequest.KnowledgeLevel} level access.
              </p>
            </div>
          </div>
        )}

        {userDrugData.PendingRequest?.Status === 'Denied' && (
          <div className="p-4 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg">
            <p>
              <span className="font-bold">Request Denied: </span>
              {userDrugData.PendingRequest.Message || 'No reason provided.'}
            </p>
          </div>
        )}
      </div>
    </FocusContext.Provider>
  );
};

// Helper components
const DrugContent = ({ drug, focusKey }) => {
  const { ref, focused } = useFocusable({
    focusKey,
  });

  return (
    <div
      ref={ref}
      className={`mx-1 text-white ${
        focused ? "border border-2 border-blue-500 p-2" : ""
      }`}
    >
      <h2 className="text-xl font-bold mb-2">Content of this sheet</h2>
      <ol className="list-decimal list-inside">
        <li>What is {drug.DrugTitle}?</li>
        <li>How to use it</li>
      </ol>
    </div>
  );
};

const KnowledgeLevelDropdown = ({ 
  currentLevel, 
  onLevelChange, 
  pendingRequest,
  highestApprovedLevel, 
  focusKey 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: () => !pendingRequest?.Status && setIsOpen(!isOpen),
  });

  const isDisabled = pendingRequest?.Status === 'Pending';

  return (
    <div ref={ref} className="relative">
      <button
        disabled={isDisabled}
        className={`
          flex items-center justify-between w-full px-4 py-2 rounded-lg 
          ${isDisabled ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}
          ${focused ? 'ring-2 ring-yellow-400' : ''}
          text-white transition-colors
        `}
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {isDisabled && (
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          )}
          <span>
            Level: {currentLevel}
            {pendingRequest?.Status === 'Pending' && 
              ` (Requesting ${pendingRequest.KnowledgeLevel})`
            }
          </span>
        </div>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && !isDisabled && (
        <div className="absolute z-10 w-full mt-1 bg-gray-700 rounded-lg shadow-lg border border-gray-600">
          {['Basic', 'Intermediate', 'Expert'].map((level) => (
            <div
              key={level}
              className={`
                px-4 py-2 cursor-pointer text-white
                hover:bg-blue-500/50 transition-colors
                ${currentLevel.toLowerCase() === level.toLowerCase() ? 'bg-blue-500' : ''}
              `}
              onClick={() => {
                onLevelChange(level);
                setIsOpen(false);
              }}
            >
              {level}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DrugCard = ({ focusKey, drug, userDrugData }) => {
  const [drugImageURL, setDrugImageURL] = useState("");
  const [imageError, setImageError] = useState(false);
  
  const { ref, focused } = useFocusable({
    focusKey,
  });

  useEffect(() => {
    const loadImage = async () => {
      try {
        if (drug?.TitleImage) {
          const imageRef = storageRef(storage, drug.TitleImage);
          const url = await getDownloadURL(imageRef);
          setDrugImageURL(url);
          setImageError(false);
        }
      } catch (error) {
        console.error('Error loading image:', error);
        setImageError(true);
      }
    };

    loadImage();
  }, [drug?.TitleImage]);

  return (
    <div
      ref={ref}
      className={`bg-gray-700 rounded-lg p-6 ${
        focused ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex flex-col md:flex-row gap-6">
        {/* Drug Information */}
        <div className="flex-1 space-y-4">
          <div className="text-gray-300">
            <span className="font-semibold text-white">Dosage:</span>{" "}
            {userDrugData?.DetailsRecap?.Dosage || "N/A"} mg
          </div>
          <div className="text-gray-300">
            <span className="font-semibold text-white">Frequency:</span>{" "}
            {userDrugData?.DoseTimes?.length || "N/A"} times a day
          </div>
          <div className="text-gray-300">
            <span className="font-semibold text-white">Modality:</span>{" "}
            {userDrugData?.DetailsRecap?.Modality || "N/A"}
          </div>
        </div>

        {/* Image Container */}
        <div className="flex-shrink-0 w-[200px] h-[200px] bg-gray-800 rounded-lg overflow-hidden">
          {drugImageURL && !imageError ? (
            <div className="w-full h-full relative group">
              <img
                src={drugImageURL}
                alt={drug.DrugTitle || 'Medication'}
                className="w-full h-full object-contain p-4 transition-all duration-300
                         group-hover:scale-110"
                style={{ backgroundColor: 'rgba(17, 24, 39, 0.7)' }}
                onError={() => setImageError(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <Package size={64} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Summary;