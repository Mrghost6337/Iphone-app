import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Linking, TextInput, View } from 'react-native';
import { GradientButton, PillButton, T } from '@/components/ui';
import { getApiKey, setApiKey } from '@/lib/ai';
import { radius, space, useColors } from '@/lib/theme';

/** Store the user's own Anthropic API key in the iOS Keychain for photo recognition. */
export default function ApiKey() {
  const c = useColors();
  const [key, setKey] = useState('');
  const [has, setHas] = useState(false);
  useEffect(() => { getApiKey().then(k => setHas(!!k)); }, []);
  return (
    <View style={{ padding: space.l, gap: space.l, paddingTop: space.xl }}>
      <T variant="h2">AI-herkenning</T>
      <T variant="sub" color={c.label2}>
        Foto’s worden herkend door Claude. Plak hier je eigen Anthropic API-sleutel; hij wordt versleuteld in de iOS-sleutelhanger bewaard en alleen gebruikt als jij een foto maakt (ongeveer 1 cent per foto).
      </T>
      <TextInput value={key} onChangeText={setKey} placeholder={has ? 'Sleutel is ingesteld · plak een nieuwe om te vervangen' : 'sk-ant-…'} placeholderTextColor={c.label3}
        autoCapitalize="none" autoCorrect={false} secureTextEntry style={{ backgroundColor: c.card, borderRadius: radius.m, padding: 16, fontSize: 16, color: c.label }} accessibilityLabel="API-sleutel" />
      <GradientButton title="Bewaar sleutel" disabled={key.trim().length < 20} onPress={async () => { await setApiKey(key); router.back(); }} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <PillButton title="Sleutel aanmaken" icon="arrow.up.right" tone="plain" style={{ flex: 1 }} onPress={() => Linking.openURL('https://platform.claude.com/settings/keys')} />
        {has ? <PillButton title="Verwijder" icon="trash" tone="danger" style={{ flex: 1 }} onPress={async () => { await setApiKey(''); setHas(false); }} /> : null}
      </View>
    </View>
  );
}
