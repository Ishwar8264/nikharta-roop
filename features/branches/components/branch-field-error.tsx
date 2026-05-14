type BranchFieldErrorProps = {
  id: string;
  message?: string;
};

// Small shared error text for realtime branch form validation.
export function BranchFieldError({ id, message }: BranchFieldErrorProps) {
  if (!message) return null;

  return (
    <span className="text-xs font-normal text-destructive" id={id}>
      {message}
    </span>
  );
}
