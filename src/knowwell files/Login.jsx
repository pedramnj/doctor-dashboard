import React, { useState, useEffect } from "react";
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import { useNavigate } from 'react-router-dom';
import { useUser } from "./UserContext";
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';

const NavigableKeyboard = ({ onKeyPress, isFocusLocked }) => {
  const [selectedKey, setSelectedKey] = useState({ row: 0, col: 0 });
  
  const { ref, focused, focusSelf } = useFocusable({
    onArrowPress: (direction) => {
      if (isFocusLocked) return true;
      
      setSelectedKey(prev => {
        let newRow = prev.row;
        let newCol = prev.col;
        const maxRows = keyboardLayout.length - 1;
        const maxCols = keyboardLayout[0].length - 1;
        
        switch(direction) {
          case 'up':
            if (prev.row > 0) {
              newRow = prev.row - 1;
              if (!keyboardLayout[newRow][prev.col]) {
                newCol = keyboardLayout[newRow].length - 1;
              }
            }
            break;
          case 'down':
            if (prev.row < maxRows) {
              newRow = prev.row + 1;
              if (!keyboardLayout[newRow][prev.col]) {
                newCol = keyboardLayout[newRow].length - 1;
              }
            }
            break;
          case 'left':
            if (prev.col > 0) {
              newCol = prev.col - 1;
            }
            break;
          case 'right':
            if (prev.col < maxCols && keyboardLayout[prev.row][prev.col + 1]) {
              newCol = prev.col + 1;
            }
            break;
        }
        
        return { row: newRow, col: newCol };
      });
      return true;
    },
    onEnterPress: () => {
      const key = keyboardLayout[selectedKey.row][selectedKey.col];
      if (key) handleKeyPress(key);
      return true;
    },
    isFocusBoundary: true
  });

  const keyboardLayout = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', '⌫'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '↵']
  ];

  const handleKeyPress = (key) => {
    switch (key) {
      case '⌫':
        onKeyPress('{bksp}');
        break;
      case '↵':
        onKeyPress('{enter}');
        break;
      default:
        onKeyPress(key);
    }
  };

  useEffect(() => {
    if (!focused && !isFocusLocked) {
      focusSelf();
    }
  }, [focused, isFocusLocked]);

  return (
    <div 
      ref={ref}
      className="p-4 bg-white/5 backdrop-blur-lg rounded-lg"
    >
      {keyboardLayout.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1 mb-2">
          {row.map((key, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              className={`p-2 m-1 min-w-[40px] text-center rounded transition-all duration-300
                ${focused && selectedKey.row === rowIndex && selectedKey.col === colIndex
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white/10 text-white hover:bg-white/20'}`}
              onClick={() => handleKeyPress(key)}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

const LoginForm = () => {
  const navigate = useNavigate();
  const [fiscalCode, setFiscalCode] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [activeInput, setActiveInput] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFocusLocked, setIsFocusLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setUser } = useUser();
  
  const { ref: formRef } = useFocusable({
    focusKey: 'FORM_WRAPPER'
  });
  
  const { ref: fiscalRef, focused: fiscalFocused, focusSelf: focusFiscal } = useFocusable({
    focusKey: 'FISCAL_INPUT',
    onEnterPress: () => setActiveInput("fiscal")
  });
  
  const { ref: secretRef, focused: secretFocused, focusSelf: focusSecret } = useFocusable({
    focusKey: 'SECRET_INPUT',
    onEnterPress: () => setActiveInput("secret")
  });
  
  const { ref: loginRef, focused: loginFocused } = useFocusable({
    focusKey: 'LOGIN_BUTTON',
    onEnterPress: handleLogin
  });

  useEffect(() => {
    const checkExistingSession = async () => {
      const savedUser = localStorage.getItem('knowwell_user');
      if (savedUser) {
        try {
          // Verify if the user exists in Firebase
          const usersRef = collection(db, 'users');
          const userDoc = await getDocs(query(usersRef, where('__name__', '==', savedUser)));
          
          if (!userDoc.empty) {
            setUser(savedUser);
            navigate('/Home');
          } else {
            // If user doesn't exist in Firebase, clear the invalid session
            localStorage.removeItem('knowwell_user');
            focusFiscal();
          }
        } catch (error) {
          console.error('Error checking session:', error);
          localStorage.removeItem('knowwell_user');
          focusFiscal();
        }
      } else {
        focusFiscal();
      }
    };

    checkExistingSession();
  }, []);

  async function handleLogin() {
    if (!fiscalCode || !secretCode) {
      setErrorMessage("Please enter both Fiscal Code and Secret Code.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      // Query users collection for matching credentials
      const querySnapshot = await getDocs(collection(db, 'users'));
      let matchedUser = null;

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.fiscalCode === fiscalCode && userData.secretCode === secretCode) {
          matchedUser = doc.id;
        }
      });

      if (matchedUser) {
        setUser(matchedUser);
        localStorage.setItem('knowwell_user', matchedUser);
        navigate('/Home');
      } else {
        setErrorMessage("Invalid Fiscal Code or Secret Code.");
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleKeyPress = (key) => {
    if (key === "{enter}") {
      setActiveInput(null);
      setIsFocusLocked(false);
      focusFiscal();
    } else if (key === "{bksp}") {
      if (activeInput === "fiscal") {
        setFiscalCode(prev => prev.slice(0, -1));
      } else if (activeInput === "secret") {
        setSecretCode(prev => prev.slice(0, -1));
      }
    } else {
      if (activeInput === "fiscal" && fiscalCode.length < 16) {
        setFiscalCode(prev => prev + key);
      } else if (activeInput === "secret" && secretCode.length < 6) {
        setSecretCode(prev => prev + key);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-gray-900 to-purple-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-20 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-20 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="flex gap-8 z-10 px-4">
        {/* Login Form */}
        <div 
          ref={formRef}
          className="backdrop-blur-lg bg-white/10 p-8 rounded-2xl shadow-2xl w-full max-w-md 
                    border border-white/20 transition-all duration-500"
        >
          {/* Logo/Title Section */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
              KnowWell
            </h1>
            <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full"></div>
          </div>

          <form className="space-y-6">
            {/* Fiscal Code Input */}
            <input
              ref={fiscalRef}
              type="text"
              readOnly
              value={fiscalCode}
              className={`w-full p-4 text-white rounded-xl transition-all duration-300 outline-none
                ${fiscalFocused 
                  ? 'bg-blue-500/20 border-2 border-blue-400 ring-2 ring-blue-400/50 shadow-lg shadow-blue-500/30' 
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}
              onClick={() => setActiveInput("fiscal")}
            />
            
            {/* Secret Code Input */}
            <input
              ref={secretRef}
              type="password"
              readOnly
              value={secretCode}
              className={`w-full p-4 text-white rounded-xl transition-all duration-300 outline-none
                ${secretFocused 
                  ? 'bg-blue-500/20 border-2 border-blue-400 ring-2 ring-blue-400/50 shadow-lg shadow-blue-500/30' 
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}
              onClick={() => setActiveInput("secret")}
            />

            {/* Error Message */}
            {errorMessage && (
              <div className="text-red-400 text-center text-sm bg-red-500/10 py-2 px-4 rounded-lg animate-fade-in">
                {errorMessage}
              </div>
            )}

            {/* Login Button */}
            <button
              ref={loginRef}
              type="button"
              disabled={loading}
              className={`w-full py-4 rounded-xl text-white font-medium transition-all duration-300
                ${loginFocused 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-blue-400 ring-2 ring-purple-400/50 shadow-lg shadow-purple-500/30 scale-[1.02]' 
                  : 'bg-white/10 hover:bg-white/20'}
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleLogin}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>

        {/* Keyboard */}
        {activeInput && (
          <div className="backdrop-blur-lg bg-white/5 rounded-2xl shadow-2xl border border-white/20 h-fit animate-fade-in">
            <NavigableKeyboard 
              onKeyPress={handleKeyPress} 
              isFocusLocked={isFocusLocked}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginForm;