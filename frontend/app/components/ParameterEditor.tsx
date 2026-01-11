import { useState } from 'react';
import { z } from 'zod';

interface Parameter {
  id?: string;
  name: string;
  description: string;
  examples?: string;
  category_id: string;
  parameter_type: 'narrative' | 'guardrail';
  global: boolean;
  applicable_industries?: Record<string, boolean>;
  sort_order?: number;
}

interface ParameterEditorProps {
  parameter?: Parameter;
  industryId?: string;
  categories: Array<{ id: string; name: string }>;
  onSave: (parameter: Parameter) => Promise<void>;
  onCancel: () => void;
}

export function ParameterEditor({
  parameter,
  industryId,
  categories,
  onSave,
  onCancel
}: ParameterEditorProps) {
  const [formData, setFormData] = useState<Parameter>(() => ({
    name: parameter?.name || '',
    description: parameter?.description || '',
    examples: parameter?.examples || '',
    category_id: parameter?.category_id || categories[0]?.id || '',
    parameter_type: parameter?.parameter_type || 'narrative',
    global: parameter?.global ?? true,
    applicable_industries: parameter?.applicable_industries || {},
    sort_order: parameter?.sort_order || 0
  }));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // If this is an industry override, ensure we're creating a new row
      if (industryId && !formData.global) {
        const newData = {
          ...formData,
          id: undefined, // Force new row creation
          applicable_industries: {
            [industryId]: true
          }
        };
        await onSave(newData);
      } else {
        await onSave(formData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save parameter');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Examples (one per line)
        </label>
        <textarea
          value={formData.examples}
          onChange={e => setFormData(prev => ({ ...prev, examples: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          rows={5}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Category
        </label>
        <select
          value={formData.category_id}
          onChange={e => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        >
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Type
        </label>
        <select
          value={formData.parameter_type}
          onChange={e => setFormData(prev => ({ 
            ...prev, 
            parameter_type: e.target.value as 'narrative' | 'guardrail' 
          }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        >
          <option value="narrative">Narrative</option>
          <option value="guardrail">Guardrail</option>
        </select>
      </div>

      {industryId && (
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isOverride"
            checked={!formData.global}
            onChange={e => setFormData(prev => ({ 
              ...prev, 
              global: !e.target.checked,
              applicable_industries: e.target.checked ? { [industryId]: true } : {}
            }))}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="isOverride" className="ml-2 block text-sm text-gray-900">
            Override this parameter for {industryId}
          </label>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
} 