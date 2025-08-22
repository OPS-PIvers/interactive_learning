import { useState, useCallback } from 'react';
import { TimelineEventData } from '../../../../shared/type-defs';
import { validateEventParameters, ValidationError } from './InteractionValidationUtils';

export const useInteractionValidation = (event: TimelineEventData | null) => {
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [hasValidated, setHasValidated] = useState(false);

  const validate = useCallback(() => {
    if (!event) return true;
    const errors = validateEventParameters(event);
    setValidationErrors(errors);
    setHasValidated(true);
    return errors.length === 0;
  }, [event]);

  const runValidation = (updatedEvent: TimelineEventData) => {
    const errors = validateEventParameters(updatedEvent);
    setValidationErrors(errors);
    setHasValidated(true);
  };

  const resetValidation = () => {
    setValidationErrors([]);
    setHasValidated(false);
  }

  return { validationErrors, hasValidated, validate, runValidation, resetValidation };
};
