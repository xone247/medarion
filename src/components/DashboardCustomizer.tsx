import React, { useState } from 'react';
import { Plus, X, RotateCcw, GripVertical, Eye, EyeOff } from 'lucide-react';
import { useDashboard } from '../contexts/DashboardContext';
import { DashboardModule } from '../types/userTypes';

interface DashboardCustomizerProps {
  onClose: () => void;
}

const DashboardCustomizer: React.FC<DashboardCustomizerProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'available'>('active');
  const { 
    userModules, 
    moduleOrder, 
    availableModules, 
    addModule, 
    removeModule, 
    reorderModules, 
    resetToDefaults,
    getModuleById 
  } = useDashboard();

  const activeModules = moduleOrder.map(id => getModuleById(id)).filter(Boolean) as DashboardModule[];
  // Filter out dashboard, my_profile, admin-only modules, glossary, and investor_search
  const visibleActive = activeModules.filter(m => 
    m.id !== 'dashboard' && 
    m.id !== 'my_profile' && 
    m.id !== 'users_manager' && 
    m.id !== 'ads_manager' &&
    m.id !== 'blog_manager' &&
    m.id !== 'users-manager-dashboard' &&
    m.id !== 'ads-manager-dashboard' &&
    m.id !== 'glossary' &&
    m.id !== 'investor_search'
  );
  const availableToAdd = availableModules.filter(module => 
    module.id !== 'dashboard' && 
    module.id !== 'my_profile' && 
    module.id !== 'users_manager' && 
    module.id !== 'ads_manager' &&
    module.id !== 'blog_manager' &&
    module.id !== 'users-manager-dashboard' &&
    module.id !== 'ads-manager-dashboard' &&
    module.id !== 'glossary' &&
    module.id !== 'investor_search' &&
    !userModules.includes(module.id)
  );

  const handleDragStart = (e: React.DragEvent, moduleId: string) => {
    e.dataTransfer.setData('text/plain', moduleId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const draggedModuleId = e.dataTransfer.getData('text/plain');
    const currentIndex = moduleOrder.indexOf(draggedModuleId);
    
    if (currentIndex !== -1) {
      const newOrder = [...moduleOrder];
      newOrder.splice(currentIndex, 1);
      // Compute target index among full order by mapping from visibleActive index
      const targetId = visibleActive[targetIndex]?.id;
      const fullTargetIndex = targetId ? newOrder.indexOf(targetId) : newOrder.length;
      newOrder.splice(fullTargetIndex, 0, draggedModuleId);
      reorderModules(newOrder);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'core': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700';
      case 'analytics': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700';
      case 'tools': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700';
      case 'data': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-700';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Customize Your Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Add, remove, and reorder modules to personalize your experience</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 p-6 pb-0 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-3 px-6 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
              activeTab === 'active'
                ? 'bg-primary-600 text-white shadow-lg transform scale-105'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
            }`}
          >
            <Eye className="h-4 w-4" />
            <span>Active Modules ({visibleActive.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 py-3 px-6 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
              activeTab === 'available'
                ? 'bg-primary-600 text-white shadow-lg transform scale-105'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
            }`}
          >
            <EyeOff className="h-4 w-4" />
            <span>Available Modules ({availableToAdd.length})</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 h-96 overflow-y-auto bg-gray-50 dark:bg-gray-800">
          {activeTab === 'active' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Drag and drop to reorder modules. Click the X to remove modules from your dashboard.
                  </p>
                </div>
                <button
                  onClick={resetToDefaults}
                  className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset to Defaults</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleActive.map((module, index) => (
                  <div
                    key={module.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, module.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 cursor-move hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <GripVertical className="h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{module.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{module.description}</p>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-2 border ${getCategoryColor(module.category)}`}>
                          {module.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeModule(module.id)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              {visibleActive.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <EyeOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No active modules</p>
                  <p>Add some modules from the Available Modules tab to get started.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                Click the + button to add modules to your dashboard. Each module provides specific functionality and insights.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableToAdd.map((module) => (
                  <div
                    key={module.id}
                    className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{module.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{module.description}</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-2 border ${getCategoryColor(module.category)}`}>
                        {module.category}
                      </span>
                    </div>
                    <button
                      onClick={() => addModule(module.id)}
                      className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg transition-colors border border-primary-700 ml-4 hover:shadow-md"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              {availableToAdd.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">All modules are active</p>
                  <p>You've added all available modules to your dashboard.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {visibleActive.length} of {availableModules.filter(m => 
              m.id !== 'dashboard' && 
              m.id !== 'my_profile' && 
              m.id !== 'users_manager' && 
              m.id !== 'ads_manager' &&
              m.id !== 'users-manager-dashboard' &&
              m.id !== 'ads-manager-dashboard' &&
              m.id !== 'glossary' &&
              m.id !== 'investor_search'
            ).length} modules active
          </div>
          <button
            onClick={handleClose}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors border border-primary-700 font-medium shadow-md hover:shadow-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardCustomizer;