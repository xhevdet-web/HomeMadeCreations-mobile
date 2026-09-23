import { useState } from 'react';
import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BeadPicker } from '@/components/designer/BeadPicker';
import { Button, Header, Notice, Page, useUI } from '@/components/common/ui';
import { useDesignStore } from '@/store/designStore';

export default function ComponentsScreen() {
  const { category } = useLocalSearchParams<{ category?: string }>();
  const design = useDesignStore();
  const [message, setMessage] = useState('');
  const ui = useUI();
  return <Page>
    <Header title={category ?? 'Choose your details'} back />
    <Text style={ui.body}>Add a little color to your current design. {design.items.length} of 32 details selected.</Text>
    {message ? <Notice text={message} /> : null}
    <BeadPicker initialCategory={category} expanded onPick={(item) => {
      const before = useDesignStore.getState().items.length;
      design.addItem(item.id);
      setMessage(useDesignStore.getState().items.length > before ? `${item.name} added to your design.` : 'This detail has reached its available quantity.');
    }} replacing={false} disabled={design.items.length >= 32} />
    <Button title="Back to my design" icon="arrow-forward" onPress={() => router.replace('/designer')} />
  </Page>;
}
