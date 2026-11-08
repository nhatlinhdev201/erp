// ============================================================
// CALCULATED FIELD DIALOG — Create/Edit Pivot Calculated Fields
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { X, Calculator, Plus, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { usePivotStore } from '../../stores/pivotStore';
import { PivotTable, CalculatedField, PivotField } from '../../types/pivot';
import { isSafeExpression } from '../../lib/safeExpression';
import './PivotTable.css';

interface CalculatedFieldDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pivot: PivotTable;
  editingField?: CalculatedField;
}

export const CalculatedFieldDialog: React.FC<CalculatedFieldDialogProps> = ({
  isOpen,
  onClose,
  pivot,
  editingField,
}) => {
  const { addCalculatedField, updateCalculatedField, removeCalculatedField } = usePivotStore();

  const [name, setName] = useState('');
  const [formula, setFormula] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Initialize from editing field
  useEffect(() => {
    if (editingField) {
      setName(editingField.name);
      setFormula(editingField.formula);
    } else {
      setName('');
      setFormula('');
    }
    setError(null);
  }, [editingField, isOpen]);

  // Get available fields for reference
  const availableFields = useMemo(() => {
    // Include regular fields
    const fields = [...pivot.fields];

    // Include other calculated fields (except the one being edited)
    pivot.calculatedFields.forEach(cf => {
      if (!editingField || cf.id !== editingField.id) {
        fields.push({
          id: cf.id,
          name: cf.name,
          sourceColumn: -1, // Calculated fields don't have a source column
          dataType: 'number' as const,
        });
      }
    });

    return fields;
  }, [pivot.fields, pivot.calculatedFields, editingField]);

  // Validate formula
  const validateFormula = (formulaStr: string): { valid: boolean; error?: string } => {
    if (!formulaStr.trim()) {
      return { valid: false, error: 'Formula cannot be empty' };
    }

    // Check for balanced brackets
    const openBrackets = (formulaStr.match(/\[/g) || []).length;
    const closeBrackets = (formulaStr.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      return { valid: false, error: 'Unbalanced brackets in formula' };
    }

    // Extract field references
    const fieldRefs = formulaStr.match(/\[([^\]]+)\]/g) || [];
    const fieldNames = availableFields.map(f => f.name.toLowerCase());

    for (const ref of fieldRefs) {
      const refName = ref.slice(1, -1).toLowerCase();
      if (!fieldNames.includes(refName)) {
        return { valid: false, error: `Unknown field: ${ref}` };
      }
    }

    // Check for basic valid expression structure
    // Remove field references and check what remains
    const withoutRefs = formulaStr.replace(/\[([^\]]+)\]/g, '1');
    // SECURITY: whitelist check instead of compiling user input via new Function
    if (!isSafeExpression(withoutRefs, false)) {
      return { valid: false, error: 'Formula chỉ cho phép số, toán tử (+ - * / %), ngoặc và so sánh' };
    }

    return { valid: true };
  };

  const formulaValidation = useMemo(() => validateFormula(formula), [formula, availableFields]);

  // Insert field reference into formula
  const insertFieldReference = (field: PivotField) => {
    setFormula(prev => prev + `[${field.name}]`);
  };

  const handleSave = () => {
    setError(null);

    // Validate name
    if (!name.trim()) {
      setError('Please enter a name for the calculated field');
      return;
    }

    // Check for duplicate name
    const existingField = pivot.calculatedFields.find(
      cf => cf.name.toLowerCase() === name.trim().toLowerCase() &&
           (!editingField || cf.id !== editingField.id)
    );
    if (existingField) {
      setError('A calculated field with this name already exists');
      return;
    }

    // Validate formula
    if (!formulaValidation.valid) {
      setError(formulaValidation.error || 'Invalid formula');
      return;
    }

    if (editingField) {
      // Update existing
      updateCalculatedField(pivot.id, editingField.id, {
        name: name.trim(),
        formula: formula.trim(),
      });
    } else {
      // Create new
      const newField: CalculatedField = {
        id: `calc_${Date.now()}`,
        name: name.trim(),
        formula: formula.trim(),
      };
      addCalculatedField(pivot.id, newField);
    }

    onClose();
  };

  const handleDelete = () => {
    if (editingField) {
      removeCalculatedField(pivot.id, editingField.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pivot-dialog-overlay" onClick={onClose}>
      <div className="pivot-dialog calculated-field-dialog" onClick={e => e.stopPropagation()}>
        <div className="pivot-dialog-header">
          <div className="pivot-dialog-title">
            <Calculator size={20} />
            <h2>{editingField ? 'Edit Calculated Field' : 'Add Calculated Field'}</h2>
          </div>
          <button className="pivot-dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="pivot-dialog-body">
          {error && (
            <div className="pivot-dialog-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="pivot-dialog-section">
            <h3>Name</h3>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="pivot-dialog-input"
              placeholder="e.g., Profit Margin"
            />
          </div>

          <div className="pivot-dialog-section">
            <div className="section-header-with-help">
              <h3>Formula</h3>
              <button
                className="help-btn"
                onClick={() => setShowHelp(!showHelp)}
                title="Show formula help"
              >
                <HelpCircle size={16} />
              </button>
            </div>

            {showHelp && (
              <div className="formula-help">
                <p><strong>Syntax:</strong> Use [FieldName] to reference fields</p>
                <p><strong>Operators:</strong> +, -, *, /, (, )</p>
                <p><strong>Examples:</strong></p>
                <ul>
                  <li><code>[Sales] - [Cost]</code> - Profit</li>
                  <li><code>[Sales] / [Quantity]</code> - Unit Price</li>
                  <li><code>([Sales] - [Cost]) / [Sales] * 100</code> - Margin %</li>
                </ul>
              </div>
            )}

            <div className="formula-input-container">
              <textarea
                value={formula}
                onChange={e => setFormula(e.target.value)}
                className={`pivot-dialog-textarea ${formulaValidation.valid ? 'valid' : formula ? 'invalid' : ''}`}
                placeholder="e.g., [Sales] - [Cost]"
                rows={3}
              />
              {formula && (
                <div className={`formula-status ${formulaValidation.valid ? 'valid' : 'invalid'}`}>
                  {formulaValidation.valid ? (
                    <>
                      <CheckCircle size={14} />
                      <span>Valid formula</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={14} />
                      <span>{formulaValidation.error}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="pivot-dialog-section">
            <h3>Available Fields</h3>
            <p className="section-hint">Click a field to insert it into the formula</p>
            <div className="available-fields-grid">
              {availableFields.map(field => (
                <button
                  key={field.id}
                  className="field-insert-btn"
                  onClick={() => insertFieldReference(field)}
                  title={`Insert [${field.name}]`}
                >
                  <Plus size={12} />
                  <span>{field.name}</span>
                  <span className={`field-type-badge type-${field.dataType}`}>
                    {field.sourceColumn === -1 ? 'Calc' : field.dataType.charAt(0).toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pivot-dialog-footer">
          {editingField && (
            <button className="pivot-btn-danger" onClick={handleDelete}>
              Delete
            </button>
          )}
          <div className="footer-spacer" />
          <button className="pivot-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="pivot-btn-primary"
            onClick={handleSave}
            disabled={!name.trim() || !formulaValidation.valid}
          >
            {editingField ? 'Update' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalculatedFieldDialog;
