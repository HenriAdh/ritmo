import { cssInterop } from 'nativewind';
import { TextInput } from 'react-native';

cssInterop(TextInput, {
  className: {
    target: 'style',
    nativeStyleToProp: {
      textAlign: true,
    },
  },
  placeholderClassName: {
    target: false,
    nativeStyleToProp: {
      color: 'placeholderTextColor',
    },
  },
  selectionClassName: {
    target: false,
    nativeStyleToProp: {
      color: 'selectionColor',
    },
  },
});