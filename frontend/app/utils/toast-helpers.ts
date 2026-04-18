import { toast } from 'sonner';

export function showError(message: string): void {
  toast.error(message);
}

export function showSuccess(message: string): void {
  toast.success(message);
}

export function showWarning(message: string): void {
  toast.warning(message);
}

export function showInfo(message: string): void {
  toast.message(message);
}

export function showLoading(message: string): string | number {
  return toast.loading(message);
}

export function dismissToast(id: string | number): void {
  toast.dismiss(id);
}

export function showPromise<T>(
  promise: Promise<T>,
  messages: { loading: string; success: string; error: string },
): void {
  void toast.promise(promise, messages);
}
