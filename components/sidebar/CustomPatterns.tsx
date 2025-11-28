'use client';

import { useState, useCallback } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';
import { useDocumentStore } from '@/lib/store';

export default function CustomPatterns() {
  const customPatterns = useDocumentStore((state) => state.customPatterns);
  const tierLimits = useDocumentStore((state) => state.tierLimits);
  
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPattern, setNewPattern] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canAddMore = customPatterns.length < tierLimits.maxCustomPatterns;

  const handleAdd = useCallback(() => {
    setError(null);
    
    if (!newName.trim() || !newPattern.trim()) {
      setError('Name and pattern are required');
      return;
    }

    // Validate regex
    try {
      new RegExp(newPattern);
    } catch {
      setError('Invalid regex pattern');
      return;
    }

    useDocumentStore.getState().addCustomPattern({
      name: newName.trim(),
      pattern: newPattern.trim(),
      type: 'CUSTOM',
      enabled: true,
    });

    setNewName('');
    setNewPattern('');
    setShowForm(false);
  }, [newName, newPattern]);

  const handleRemove = useCallback((id: string) => {
    useDocumentStore.getState().removeCustomPattern(id);
  }, []);

  const handleToggle = useCallback((id: string, enabled: boolean) => {
    useDocumentStore.getState().updateCustomPattern(id, { enabled });
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Custom Patterns
        </h3>
        <span className="text-xs text-gray-500">
          {customPatterns.length}/{tierLimits.maxCustomPatterns}
        </span>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg mb-3">
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Add custom regex patterns to detect specific formats like internal IDs, case numbers, etc.
        </p>
      </div>

      {/* Existing patterns */}
      {customPatterns.length > 0 && (
        <div className="space-y-2 mb-3">
          {customPatterns.map((pattern) => (
            <div
              key={pattern.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={pattern.enabled}
                  onChange={() => handleToggle(pattern.id, !pattern.enabled)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {pattern.name}
                  </p>
                  <p className="text-xs text-gray-500 font-mono truncate">
                    {pattern.pattern}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRemove(pattern.id)}
                className="p-1 text-gray-400 hover:text-red-600 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm ? (
        <div className="space-y-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Pattern name"
            className="input"
          />
          <input
            type="text"
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            placeholder="Regex pattern (e.g., \d{3}-\d{4})"
            className="input font-mono text-sm"
          />
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="btn-primary flex-1 text-sm"
            >
              Add Pattern
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          disabled={!canAddMore}
          className="btn-secondary w-full gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Custom Pattern
        </button>
      )}

      {!canAddMore && !showForm && (
        <p className="text-xs text-amber-600 mt-2 text-center">
          Free tier limit reached. Upgrade to add more patterns.
        </p>
      )}
    </div>
  );
}
