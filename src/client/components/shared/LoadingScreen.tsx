import React from 'react';
import { Icon } from '../Icon';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Initializing module..." 
}) => {
  console.log('=== LOADING SCREEN RENDERING ===');
  console.log('LoadingScreen: Message:', message);
  
  return (
    <div 
      className="flex items-center justify-center h-full"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1e293b',
        color: '#f1f5f9',
        zIndex: 9999
      }}
    >
      <div className="text-center">
        <Icon name="LoadingSpinner" className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
        <div 
          className="text-white text-lg"
          style={{ 
            color: '#f1f5f9',
            fontSize: '18px',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          {message}
        </div>
        <div 
          style={{ 
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#374151',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#94a3b8'
          }}
        >
          Debug: LoadingScreen component active
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;