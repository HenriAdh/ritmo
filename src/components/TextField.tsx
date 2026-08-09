import { TextInput, type TextInputProps } from 'react-native';

const FIELD_CLASSES =
  'rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100';

type TextFieldProps = TextInputProps;

export function TextField({ className = '', ...props }: TextFieldProps) {
  return (
    <TextInput
      {...props}
      className={`${FIELD_CLASSES} ${className}`}
      placeholderClassName="text-neutral-400 dark:text-neutral-500"
    />
  );
}