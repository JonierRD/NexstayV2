import { type CreateClienteInput } from '../../lib/api';

export type FormState = Omit<CreateClienteInput, 'adminPassword'>;

export const emptyForm: FormState = {
  firstName: '',
  lastName: '',
  cc: '',
  phone: '',
  cityOrigin: '',
  cityDestination: '',
  profession: '',
  notes: ''
};