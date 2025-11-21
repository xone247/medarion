import React from 'react';
import { useNavigation } from '../contexts/NavigationContext';

interface SPANavigationProps {
  children?: React.ReactNode;
}

const SPANavigation: React.FC<SPANavigationProps> = ({ children }) => {
  let navigationContext;
  try {
    navigationContext = useNavigation();
  } catch (error) {
    // Context not available, render children directly
    return <>{children}</>;
  }
  
  const { 
    currentModule, 
    availableModules, 
    defaultModule
  } = navigationContext;

  // Get current module component
  const getCurrentModuleComponent = () => {
    if (!currentModule) return null;
    
    const module = availableModules.find(m => m.id === currentModule);
    if (!module) return null;

    const { component: Component } = module;
    return React.createElement(Component, {
      key: currentModule,
      onBack: () => {
        // Navigate back to default module
        const defaultModuleComponent = availableModules.find(m => m.id === defaultModule);
        if (defaultModuleComponent) {
          // This will be handled by the navigation context
        }
      }
    });
  };

  // Render current module or children (if provided, use children; otherwise use module from context)
  // This allows direct route components to render while still supporting NavigationContext
  return (
    <div className="module-container">
      {children || getCurrentModuleComponent()}
    </div>
  );
};

export default SPANavigation;
