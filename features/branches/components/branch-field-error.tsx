type BranchFieldErrorProps = {
  id: string;
  message?: string;
};

// Small shared error text for realtime branch form validation.
export function BranchFieldError({ id, message }: BranchFieldErrorProps) {
  return (
    <span
      className="block min-h-4 text-xs font-normal text-destructive"
      id={id}
    >
      {message}
    </span>
  );
}
