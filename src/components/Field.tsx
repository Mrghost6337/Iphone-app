import { TextInput } from 'react-native';
import { radius, useColors } from '@/lib/theme';

export function Field({ value, onChange, placeholder, multiline, autoFocus, keyboardType, textContentType }: {
  value: string; onChange: (v: string) => void; placeholder: string; multiline?: boolean; autoFocus?: boolean;
  keyboardType?: 'email-address' | 'default' | 'number-pad'; textContentType?: 'givenName' | 'emailAddress' | 'none';
}) {
  const c = useColors();
  return (
    <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={c.label3} multiline={multiline} autoFocus={autoFocus}
      keyboardType={keyboardType} textContentType={textContentType} autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
      style={{ backgroundColor: c.card, borderRadius: radius.m, padding: 17, fontSize: 17, color: c.label, minHeight: multiline ? 110 : undefined, textAlignVertical: multiline ? 'top' : 'center' }} />
  );
}
