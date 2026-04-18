import { toast } from 'sonner';

import {
  dismissToast,
  showError,
  showInfo,
  showLoading,
  showPromise,
  showSuccess,
  showWarning,
} from './toast-helpers';

jest.mock('sonner', () => ({
  toast: Object.assign(jest.fn(), {
    error: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    message: jest.fn(),
    loading: jest.fn(() => 42),
    dismiss: jest.fn(),
    promise: jest.fn(),
  }),
}));

describe('toast-helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('showError delegates to toast.error', () => {
    showError('oops');
    expect(toast.error).toHaveBeenCalledWith('oops');
  });

  it('showSuccess delegates to toast.success', () => {
    showSuccess('yay');
    expect(toast.success).toHaveBeenCalledWith('yay');
  });

  it('showWarning delegates to toast.warning', () => {
    showWarning('careful');
    expect(toast.warning).toHaveBeenCalledWith('careful');
  });

  it('showInfo delegates to toast.message', () => {
    showInfo('fyi');
    expect(toast.message).toHaveBeenCalledWith('fyi');
  });

  it('showLoading returns the toast id from toast.loading', () => {
    const id = showLoading('loading…');
    expect(toast.loading).toHaveBeenCalledWith('loading…');
    expect(id).toBe(42);
  });

  it('dismissToast delegates to toast.dismiss', () => {
    dismissToast(42);
    expect(toast.dismiss).toHaveBeenCalledWith(42);
  });

  it('showPromise forwards both the promise and message map to toast.promise', () => {
    const p = Promise.resolve('ok');
    const messages = { loading: 'L', success: 'S', error: 'E' };
    showPromise(p, messages);
    expect(toast.promise).toHaveBeenCalledWith(p, messages);
  });
});
