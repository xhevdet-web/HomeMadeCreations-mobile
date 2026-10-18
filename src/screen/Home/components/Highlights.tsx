import { StyleSheet, Text, View } from 'react-native';
import { Icon, IconName, useUI } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { type Theme } from '@/constants/theme';

const promises: { icon: IconName; title: string; detail: string }[] = [
  { icon: 'hand-left-outline', title: 'Handmade', detail: 'Crafted piece by piece' },
  { icon: 'cash-outline', title: 'Pay on delivery', detail: 'Nothing to pay upfront' },
  { icon: 'home-outline', title: 'To your door', detail: 'We deliver it for you' },
];

export function TrustStrip() {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.trust}>
      {promises.map((item) => (
        <View key={item.title} style={styles.trustItem}>
          <Icon name={item.icon} size={20} color={theme.colors.accent} />
          <Text style={styles.trustTitle}>{item.title}</Text>
          <Text style={styles.trustDetail}>{item.detail}</Text>
        </View>
      ))}
    </View>
  );
}

export interface UpcomingFeature {
  title: string;
  detail: string;
  icon: IconName;
  /** Real catalog images to preview the feature; falls back to the icon. */
  images?: (string | null | undefined)[];
}

// Static teasers until these features exist. Image tiles reuse catalog photos from the
// dashboard so the preview already looks like the finished feature.
export function ComingNext({ features }: { features: UpcomingFeature[] }) {
  const ui = useUI();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={{ gap: 14 }}>
      <View>
        <Text style={ui.eyebrow}>ON THE WORKBENCH</Text>
        <Text style={styles.heading}>Coming next</Text>
      </View>
      <View style={styles.grid}>
        {features.map((feature) => <FeatureTile key={feature.title} feature={feature} />)}
      </View>
    </View>
  );
}

function FeatureTile({ feature }: { feature: UpcomingFeature }) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const images = (feature.images ?? []).filter(Boolean).slice(0, 3);
  return (
    <View style={styles.tile} accessible
      accessibilityLabel={`${feature.title}, coming soon. ${feature.detail}`}>
      <View style={styles.visual}>
        {images.length ? (
          <View style={styles.collage}>
            {images.map((url, index) => (
              <View key={index} style={[styles.collageItem, {
                transform: [{ rotate: `${(index - (images.length - 1) / 2) * 9}deg` },
                  { translateY: index === 1 ? -4 : 0 }],
                zIndex: index === 1 ? 2 : 1,
              }]}>
                <CatalogImage imageUrl={url} name={feature.title} size={48} />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.iconWrap}>
            <Icon name={feature.icon} size={26} color={theme.colors.accent} />
          </View>
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>SOON</Text>
        </View>
      </View>
      <View style={{ padding: 12, gap: 3 }}>
        <Text style={styles.tileTitle} numberOfLines={1}>{feature.title}</Text>
        <Text style={styles.trustDetail} numberOfLines={2}>{feature.detail}</Text>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    heading: { color: c.text, fontFamily: theme.fonts.editorial, fontSize: 24 },
    trust: {
      flexDirection: 'row',
      gap: 8,
      padding: 16,
      borderRadius: 18,
      backgroundColor: c.soft,
    },
    trustItem: { flex: 1, gap: 4, alignItems: 'center' },
    trustTitle: { color: c.text, fontSize: 12, fontWeight: '600', textAlign: 'center' },
    trustDetail: { color: c.muted, fontSize: 11, lineHeight: 16 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    tile: {
      flexBasis: '47%', flexGrow: 1, borderRadius: 18, overflow: 'hidden',
      borderWidth: 1, borderStyle: 'dashed', borderColor: c.border, backgroundColor: c.surface,
    },
    visual: {
      height: 96, backgroundColor: c.thumbnail, alignItems: 'center', justifyContent: 'center',
    },
    collage: { flexDirection: 'row', alignItems: 'center' },
    collageItem: {
      width: 56, height: 56, borderRadius: 14, marginHorizontal: -6, backgroundColor: c.surface,
      borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', opacity: 0.92,
    },
    iconWrap: {
      width: 52, height: 52, borderRadius: 16, backgroundColor: c.surface,
      alignItems: 'center', justifyContent: 'center',
    },
    badge: {
      position: 'absolute', top: 8, right: 8, paddingHorizontal: 8, paddingVertical: 3,
      borderRadius: 8, backgroundColor: c.primary,
    },
    badgeText: { color: c.onPrimary, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
    tileTitle: { color: c.text, fontSize: 14, fontWeight: '600' },
  });
};
