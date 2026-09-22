import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Header, IconButton, Notice, Page, useUI } from '@/components/common/ui';
import { JewelryCanvas } from '@/components/designer/JewelryCanvas';
import { DesignItem } from '@/components/designer/DesignItem';
import { BeadPicker } from '@/components/designer/BeadPicker';
import { useDesignStore } from '@/store/designStore';
import { useSavedStore } from '@/store/savedStore';
import { useAuthStore } from '@/store/authStore';
import { itemById, productById } from '@/services/catalog';
import { type Theme } from '@/constants/theme';
import { designPrice, money } from '@/helper/pricing';

export default function DesignerScreen() {
  const theme = useTheme();
  const ui = useUI();
  const styles = useThemedStyles(createStyles);

  const design = useDesignStore();
  const [message, setMessage] = useState('');
  const { width } = useWindowDimensions();
  const product = productById[design.productId];
  const selectedIndex = design.items.findIndex((item) => item.id === design.selectedId);
  function save() {
    const snapshot = design.snapshot(useAuthStore.getState().user?.id ?? 'guest');
    useSavedStore.getState().save(snapshot);
    design.markSaved(snapshot.id);
    setMessage('Saved to My Designs. Keep creating, or take a peek.');
  }
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Page stickyHeaderIndices={[2]}>
        <Header
          title="Your creative studio"
          subtitle={product.name + ' · ' + design.size}
          back
          right={
            <IconButton
              name="bookmark-outline"
              label="Save design"
              onPress={save}
              disabled={!design.items.length}
            />
          }
        />
        <View style={ui.between}>
          <Text style={ui.eyebrow}>A PIECE THAT’S ENTIRELY YOU</Text>
          <View style={ui.row}>
            <IconButton
              name="arrow-undo-outline"
              label="Undo"
              onPress={design.undo}
              disabled={design.historyIndex === 0}
            />
            <IconButton
              name="arrow-redo-outline"
              label="Redo"
              onPress={design.redo}
              disabled={design.historyIndex === design.history.length - 1}
            />
          </View>
        </View>
        <View style={styles.canvas}>
          <JewelryCanvas
            items={design.items}
            type={product.type}
            size={Math.min(width - 48, 360)}
            selectedId={design.selectedId}
            onSelect={(id) => design.select(id === design.selectedId ? null : id)}
          />
          {!design.items.length && (
            <View pointerEvents="none" style={styles.canvasHint}>
              <Text style={styles.hintTitle}>A blank canvas.{'\n'}A thousand possibilities.</Text>
              <Text style={[ui.caption, { textAlign: 'center', marginTop: 9 }]}>
                Choose your first bead below
              </Text>
            </View>
          )}
          <Text style={styles.counter}>{design.items.length} / 32 DETAILS</Text>
        </View>
        <View style={ui.between}>
          <Text style={ui.caption}>
            {design.selectedId
              ? 'Tap a bead below to replace this detail.'
              : 'Select a detail on your piece to edit it.'}
          </Text>
          <Pressable
            disabled={!design.items.length}
            onPress={() => {
              design.clear();
              setMessage('Canvas cleared. Tap Undo to bring it back.');
            }}
            hitSlop={10}
          >
            <Text style={ui.textLink}>Clear</Text>
          </Pressable>
        </View>
        {!!design.items.length && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {design.items.map((entry, index) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  'Select position ' + (index + 1) + ', ' + itemById[entry.itemId].name
                }
                key={entry.id}
                onPress={() => design.select(entry.id === design.selectedId ? null : entry.id)}
                style={[
                  styles.selectedBead,
                  entry.id === design.selectedId && { borderColor: theme.colors.accent },
                ]}
              >
                <DesignItem item={itemById[entry.itemId]} size={34} />
                <Text style={styles.position}>{index + 1}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
        {design.selectedId && (
          <Animated.View entering={FadeIn.duration(180)} style={ui.between}>
            <Text style={[ui.caption, { flex: 1 }]}>
              {itemById[design.items[selectedIndex].itemId].name}
            </Text>
            <IconButton
              name="arrow-back"
              label="Move detail left"
              onPress={() => design.moveItem(-1)}
              disabled={selectedIndex <= 0}
            />
            <IconButton
              name="arrow-forward"
              label="Move detail right"
              onPress={() => design.moveItem(1)}
              disabled={selectedIndex >= design.items.length - 1}
            />
            <IconButton
              name="trash-outline"
              label="Remove selected detail"
              onPress={design.removeItem}
            />
            <IconButton name="close" label="Finish selecting" onPress={() => design.select(null)} />
          </Animated.View>
        )}
        {message ? <Notice text={message} /> : null}
        {design.items.length === 32 && !design.selectedId && (
          <Text style={ui.caption}>
            Your piece is full. Select a detail to replace or remove it.
          </Text>
        )}
        <BeadPicker
          replacing={!!design.selectedId}
          disabled={design.items.length >= 32 && !design.selectedId}
          onPick={(item) => {
            setMessage('');
            if (design.selectedId) design.replaceItem(item.id);
            else design.addItem(item.id);
          }}
        />
      </Page>
      <SafeAreaView edges={['bottom']} style={styles.bottom}>
        <View style={[ui.between, { width: '100%', maxWidth: 876, alignSelf: 'center' }]}>
          <View>
            <Text style={ui.caption}>Your creation</Text>
            <Text style={styles.total}>{money(designPrice(product.basePrice, design.items))}</Text>
          </View>
          <Button
            title="Preview"
            icon="arrow-forward"
            disabled={!design.items.length}
            onPress={() => router.push('/preview')}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    canvas: {
      alignItems: 'center',
      backgroundColor: theme.colors.canvas,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 24,
      overflow: 'hidden',
    },
    canvasHint: { position: 'absolute', top: '35%', alignItems: 'center' },
    hintTitle: {
      color: theme.colors.text,
      fontFamily: theme.fonts.editorial,
      fontSize: 18,
      textAlign: 'center',
      lineHeight: 25,
    },
    counter: {
      position: 'absolute',
      bottom: 14,
      fontSize: 8,
      letterSpacing: 2,
      color: theme.colors.gold,
    },
    selectedBead: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: 6,
      alignItems: 'center',
      minWidth: 48,
    },
    position: { color: theme.colors.muted, fontSize: 8 },
    bottom: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      padding: 18,
      backgroundColor: theme.colors.bottomBar,
    },
    total: { color: theme.colors.text, fontSize: 26, fontWeight: '600', marginTop: 3 },
  });
};
