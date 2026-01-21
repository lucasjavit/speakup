import { ErrorModal } from '@/components/ui/ErrorModal';
import { useErrorStore } from '@/stores/errorStore';

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const { currentError, hideError } = useErrorStore();

  return (
    <>
      {children}
      {currentError && (
        <ErrorModal
          isOpen={true}
          onClose={hideError}
          title={currentError.title}
          message={currentError.message}
          details={currentError.details}
          severity={currentError.severity}
          actionLabel={currentError.actionLabel}
          onAction={currentError.onAction}
        />
      )}
    </>
  );
}
