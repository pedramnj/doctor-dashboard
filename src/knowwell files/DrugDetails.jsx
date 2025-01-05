import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Summary from "./Summary";
import Description from "./Description";
import Usage from "./Usage";
import {
  useFocusable,
  FocusContext,
  setFocus,
} from "@noriginmedia/norigin-spatial-navigation";
import { init } from "@noriginmedia/norigin-spatial-navigation";
import { db } from "../../Firebase";
import {
  getDoc,
  doc,
  updateDoc
} from "firebase/firestore";
import { useUser } from "../UserContext";

init({
  distanceCalculationMethod: "center",
});

export const focusKeys = {
  PAGE_NAME: "DRUG_DETAILS",
  NAVBAR: "NAVBAR",
  NAVBAR_BACK: "NAVBAR_BACK",
  NAVBAR_APP_NAME: "NAVBAR_APP_NAME",
  NAVBAR_INFO_BUTTON: "NAVBAR_INFO_BUTTON",
  SUMMARY: "SUMMARY",
  SUMMARY_SHEET_CONTENT: "SUMMARY_SHEET_CONTENT",
  SUMMARY_DRUG_CARD: "SUMMARY_DRUG_CARD",
  SUMMARY_KNOWLEDGE_LEVEL_DROPDOWN: "SUMMARY_KNOWLEDGE_LEVEL_DROPDOWN",
  SUMMARY_KNOWLEDGE_LEVEL_DROPDOWN_ITEMS: "SUMMARY_KNOWLEDGE_LEVEL_DROPDOWN_ITEMS",
  SUMMARY_KNOWLEDGE_LEVEL_DROPDOWN_ITEMS_BASIC: "SUMMARY_KNOWLEDGE_LEVEL_DROPDOWN_ITEMS_BASIC",
  SUMMARY_KNOWLEDGE_LEVEL_DROPDOWN_ITEMS_INTERMEDIATE: "SUMMARY_KNOWLEDGE_LEVEL_DROPDOWN_ITEMS_INTERMEDIATE",
  SUMMARY_KNOWLEDGE_LEVEL_DROPDOWN_ITEMS_EXPERT: "SUMMARY_KNOWLEDGE_LEVEL_DROPDOWN_ITEMS_EXPERT",
  DRUG_DESCRIPTION: "DRUG_DESCRIPTION",
  DRUG_USAGE: "DRUG_USAGE",
  DRUG_USAGE_P1: "DRUG_USAGE_P1",
  DRUG_USAGE_P2: "DRUG_USAGE_P2",
  INFO_MODAL: "INFO_MODAL",
  INFO_MODAL_HELP: "INFO_MODAL_HELP",
  CHAT_WRAPPER: "CHAT_WRAPPER",
  CHAT_CLOSE: "CHAT_CLOSE",
  CHAT_INPUT: "CHAT_INPUT",
  KEYBOARD_WRAPPER: "KEYBOARD_WRAPPER"
};

const INITIAL_DRUG_DATA = {
  Category: "",
  Basic: [{
    Title: "",
    Content: [""]
  }],
  Intermediate: [{
    Title: "",
    Content: [""]
  }],
  Expert: [{
    Title: "",
    Content: [""]
  }],
  DrugTitle: "",
  TitleImage: ""
};

const DrugDetails = () => {
  const { drugName } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [knowledgeLevel, setKnowledgeLevel] = useState("basic");
  const [drug, setDrug] = useState(INITIAL_DRUG_DATA);
  const [highestApprovedLevel, setHighestApprovedLevel] = useState("basic");
  const [userDrugData, setUserDrugData] = useState({
    DetailsRecap: {
      Dosage: 0,
      Modality: "",
    },
    DrugReference: null,
    KnowledgeLevel: "basic",
    TitleImage: "",
    Category: "",
    DoseTimes: [""],
  });
  
  const { ref, focusKey } = useFocusable({
    focusKey: focusKeys.PAGE_NAME,
  });

  // Authentication check
  useEffect(() => {
    const savedUser = localStorage.getItem('knowwell_user');
    if (!savedUser) {
      navigate('/');
      return;
    }
  }, []);

  const getLevelValue = (level) => {
    const levels = { basic: 1, intermediate: 2, expert: 3 };
    return levels[level.toLowerCase()] || 1;
  };

  // Handle request status changes
  useEffect(() => {
    const handleRequestStatus = async () => {
      if (userDrugData?.PendingRequest?.Status === 'Accepted') {
        const approvedLevel = userDrugData.PendingRequest.KnowledgeLevel.toLowerCase();
        setHighestApprovedLevel(approvedLevel);
        setKnowledgeLevel(approvedLevel);

        try {
          const userDrugRef = doc(db, user, drugName);
          await updateDoc(userDrugRef, {
            KnowledgeLevel: approvedLevel,
            HighestApprovedLevel: approvedLevel,
            PendingRequest: {
              KnowledgeLevel: '',
              Status: '',
              Message: ''
            }
          });
        } catch (error) {
          console.error('Error updating knowledge level:', error);
        }
      }
    };

    handleRequestStatus();
  }, [userDrugData?.PendingRequest?.Status]);

  const handleKnowledgeLevelChange = async (newLevel) => {
    const newLevelValue = getLevelValue(newLevel);
    const highestApprovedValue = getLevelValue(highestApprovedLevel);

    if (newLevelValue <= highestApprovedValue) {
      // Can freely change to this level
      try {
        const userDrugRef = doc(db, user, drugName);
        await updateDoc(userDrugRef, {
          KnowledgeLevel: newLevel.toLowerCase()
        });
        setKnowledgeLevel(newLevel.toLowerCase());
      } catch (error) {
        console.error('Error updating knowledge level:', error);
      }
    } else {
      // Need to request approval
      await handleKnowledgeLevelRequest(newLevel);
    }
  };

  const fetchUserDrugDetails = async (user, drugName) => {
    try {
      const userDocRef = doc(db, user, drugName);
      const userDoc = await getDoc(userDocRef);
  
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("User drug data fetched for user", user, ":", userData);
  
        // Set highest approved level
        setHighestApprovedLevel(userData.HighestApprovedLevel?.toLowerCase() || 'basic');
        
        // Set current knowledge level
        setKnowledgeLevel(userData.KnowledgeLevel.toLowerCase());
        
        setUserDrugData(userData);
  
        if (userData.DrugReference) {
          const drugDoc = await getDoc(userData.DrugReference);
  
          if (drugDoc.exists()) {
            const drugData = drugDoc.data();
            console.log("Drug data fetched:", drugData);
            setDrug(drugData);
          } else {
            console.log("No such drug document!");
            setDrug(null);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching drug details:", error);
    }
  };

  const handleKnowledgeLevelRequest = async (requestedLevel) => {
    try {
      const userDrugRef = doc(db, user, drugName);
      
      if (userDrugData.PendingRequest?.Status === "Pending") {
        alert("You already have a pending request for this medication.");
        return;
      }

      await updateDoc(userDrugRef, {
        PendingRequest: {
          KnowledgeLevel: requestedLevel,
          Status: 'Pending',
          Message: ''
        }
      });

      setUserDrugData(prev => ({
        ...prev,
        PendingRequest: {
          KnowledgeLevel: requestedLevel,
          Status: 'Pending',
          Message: ''
        }
      }));

      alert('Knowledge level upgrade request sent successfully!');
    } catch (error) {
      console.error('Error updating knowledge level request:', error);
      alert('Failed to send request. Please try again.');
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (user && drugName) {
      console.log("Fetching drug details for user:", user);
      fetchUserDrugDetails(user, drugName);
    }
  }, [user, drugName]);

  // Focus management
  useEffect(() => {
    setFocus(focusKeys.NAVBAR);
  }, [focusKey]);

  if (!drug || !drug.DrugTitle || !drug.DrugTitle.length > 0) {
    return <p className="text-light">No drug for this user found!</p>;
  }

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} tabIndex={0} className="bg-gray-800 text-light min-vh-100">
        <Navbar focusKey={focusKeys.NAVBAR} />
        <div className="bg-gray-700 text-black m-1 p-5 rounded-lg shadow-lg">
        <Summary
  drug={drug}
  userDrugData={userDrugData}
  knowledgeLevel={knowledgeLevel}
  setKnowledgeLevel={handleKnowledgeLevelChange}  // This is the current prop name
  highestApprovedLevel={highestApprovedLevel}
  focusKey={focusKeys.SUMMARY}
/>

          <Description drug={drug} focusKey={focusKeys.DRUG_DESCRIPTION} />
          <Usage
            knowledgeLevel={knowledgeLevel}
            drug={drug}
            focusKey={focusKeys.DRUG_USAGE}
          />
        </div>
      </div>
    </FocusContext.Provider>
  );
};
export default DrugDetails;