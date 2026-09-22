import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Chips, EmptyState, Header, IconButton, Page, useUI } from '@/components/common/ui';
import { SavedDesignCard } from '@/components/products/SavedDesignCard';
import { useSavedStore } from '@/store/savedStore';
import { useAuthStore } from '@/store/authStore';
import { productById } from '@/services/catalog';
import { Design } from '@/types/models';
export default function DesignsScreen() {
  const ui = useUI();

  const { designs, remove, duplicate, save } = useSavedStore();
  const user = useAuthStore((state) => state.user);
  const [filter, setFilter] = useState('All pieces');
  const [deleted, setDeleted] = useState<Design | null>(null);
  const owned = designs.filter(
    (design) => design.userId === (user?.id ?? 'guest') || design.userId === 'guest',
  );
  const visible = owned.filter(
    (design) =>
      filter === 'All pieces' ||
      productById[design.productId].type === (filter === 'Bracelets' ? 'bracelet' : 'necklace'),
  );
  return (
    <Page>
      <Header
        title="My Designs"
        subtitle="Little pieces of your imagination."
        right={
          <IconButton name="add" label="Create a new design" onPress={() => router.push('/')} />
        }
      />
      <View>
        <Text style={ui.eyebrow}>YOUR PERSONAL COLLECTION</Text>
        <Text style={ui.title}>Made of you.</Text>
      </View>
      <Chips
        options={['All pieces', 'Bracelets', 'Necklaces']}
        value={filter}
        onChange={setFilter}
      />
      {deleted && (
        <View style={[ui.card, ui.between]}>
          <Text style={[ui.caption, { flex: 1 }]}>Design removed.</Text>
          <Pressable
            onPress={() => {
              save(deleted);
              setDeleted(null);
            }}
          >
            <Text style={ui.textLink}>Undo</Text>
          </Pressable>
        </View>
      )}
      {visible.map((design) => (
        <SavedDesignCard
          key={design.id}
          design={design}
          onDuplicate={() => duplicate(design.id)}
          onDelete={() => {
            setDeleted(design);
            remove(design.id);
          }}
        />
      ))}
      {!visible.length && (
        <EmptyState
          icon="heart-outline"
          title={owned.length ? 'A new chapter awaits.' : 'Your ideas belong here.'}
          description="Create a piece, save it, and come back whenever inspiration finds you."
          action="Find your starting point"
          onPress={() => router.push('/')}
        />
      )}
    </Page>
  );
}
