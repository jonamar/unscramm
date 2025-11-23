import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

const cx = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(' ');

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
};

export function RectButton({ className, children, ...props }: ButtonProps) {
  return (
    <button className={cx('ds-rect-button', className)} {...props}>
      {children}
    </button>
  );
}

export function CircleButton({ className, children, ...props }: ButtonProps) {
  return (
    <button className={cx('ds-circle-button', className)} {...props}>
      {children}
    </button>
  );
}

interface InputFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  actionIcon?: ReactNode;
  onAction?: () => void;
  actionAriaLabel?: string;
  actionDisabled?: boolean;
}

export function InputField({
  value,
  onChange,
  actionIcon,
  onAction,
  actionAriaLabel = 'Submit',
  actionDisabled,
  className,
  ...inputProps
}: InputFieldProps) {
  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter' && onAction && !actionDisabled && !inputProps.disabled) {
      event.preventDefault();
      onAction();
    }
  };

  return (
    <div className={cx('ds-input', className)}>
      <input
        {...inputProps}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          aria-label={actionAriaLabel}
          disabled={actionDisabled || inputProps.disabled}
        >
          {actionIcon}
        </button>
      )}
    </div>
  );
}
