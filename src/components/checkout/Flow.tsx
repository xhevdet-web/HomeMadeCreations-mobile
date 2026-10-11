import { ReactNode, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Button, Icon, IconName, useUI } from '@/components/common/ui';
import { CatalogImage } from '@/components/products/CatalogImage';
import { useTheme } from '@/hooks/useTheme';
import { money } from '@/helper/pricing';
import { OrderedProduct, SavedProduct } from '@/services/commerceApi';

export function TextAction({
  title,
  onPress,
  icon,
  disabled = false,
  loading = false,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 44,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        opacity: disabled || pressed ? 0.5 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.accent} />
      ) : (
        icon && <Icon name={icon} size={16} color={theme.colors.accent} />
      )}
      <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: '600' }}>{title}</Text>
    </Pressable>
  );
}

export function Disclosure({
  title,
  summary,
  children,
  initiallyOpen = false,
  disabled = false,
}: {
  title: string;
  summary?: string;
  children: ReactNode;
  initiallyOpen?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const ui = useUI();
  const theme = useTheme();
  return (
    <View style={[ui.card, { padding: 16, gap: 0 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: open, disabled }}
        aria-expanded={open}
        disabled={disabled}
        onPress={() => setOpen(!open)}
        style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12 }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={ui.label}>{title}</Text>
          {!!summary && <Text style={ui.caption}>{summary}</Text>}
        </View>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.muted} />
      </Pressable>
      {open && <View style={{ paddingTop: 16, gap: 16 }}>{children}</View>}
    </View>
  );
}

export function FlowStep({ step }: { step: 1 | 2 }) {
  const theme = useTheme();
  return (
    <View
      accessibilityLabel={`Step ${step} of 2: ${step === 1 ? 'Your design' : 'Delivery and payment'}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
    >
      {['Your design', 'Delivery & payment'].map((label, index) => (
        <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <View
            style={{
              width: 23,
              height: 23,
              borderRadius: 12,
              backgroundColor: index + 1 <= step ? theme.colors.primary : theme.colors.elevated,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {index + 1 < step ? (
              <Icon name="checkmark" size={13} color={theme.colors.onPrimary} />
            ) : (
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: index + 1 === step ? theme.colors.onPrimary : theme.colors.muted,
                }}
              >
                {index + 1}
              </Text>
            )}
          </View>
          <Text
            style={{
              fontSize: 11,
              color: index + 1 === step ? theme.colors.text : theme.colors.muted,
            }}
          >
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function ActionFooter({
  title,
  onPress,
  amount,
  amountLabel = 'Total',
  caption,
  disabled,
  loading,
}: {
  title: string;
  onPress: () => void;
  amount?: number;
  amountLabel?: string;
  caption?: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  const ui = useUI();
  const theme = useTheme();
  return (
    <View
      testID="flow-action-footer"
      style={{
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.bottomBar,
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 600,
          alignSelf: 'center',
          paddingHorizontal: 22,
          paddingVertical: 14,
          gap: 12,
        }}
      >
        {amount !== undefined && (
          <View style={ui.between}>
            <Text style={ui.caption}>{amountLabel}</Text>
            <Text style={{ fontSize: 23, color: theme.colors.text, fontWeight: '600' }}>
              {money(amount)}
            </Text>
          </View>
        )}
        <Button title={title} onPress={onPress} loading={loading} disabled={disabled} />
        {!!caption && (
          <Text style={[ui.caption, { textAlign: 'center', fontSize: 11 }]}>{caption}</Text>
        )}
      </View>
    </View>
  );
}

export function ProductOverview({
  product,
  action,
}: {
  product: OrderedProduct | SavedProduct;
  action?: ReactNode;
}) {
  const ui = useUI();
  const theme = useTheme();
  const size = 'selectedSize' in product ? product.selectedSize : undefined;
  return (
    <View style={[ui.card, { padding: 16, gap: 12 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={{ backgroundColor: theme.colors.thumbnail, borderRadius: 16, overflow: 'hidden' }}
        >
          <CatalogImage
            imageUrl={product.designPreviewUrl ?? product.imageUrl}
            name={product.name}
            size={80}
          />
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={[ui.sectionTitle, { fontSize: 22 }]}>{product.name}</Text>
          <Text style={ui.caption}>
            {product.productType === 'READY_MADE'
              ? 'Ready-made jewelry'
              : `${product.itemCount} beads · Custom design`}
          </Text>
          {size && (
            <Text style={ui.caption}>
              {size.name} · {size.measurement} {size.unit}
            </Text>
          )}
        </View>
      </View>
      {action && <View style={{ alignItems: 'flex-end' }}>{action}</View>}
    </View>
  );
}

export function DetailRow({ label, value }: { label: string; value: string }) {
  const ui = useUI();
  return (
    <View style={[ui.between, { alignItems: 'flex-start' }]}>
      <Text style={[ui.caption, { flex: 1 }]}>{label}</Text>
      <Text style={[ui.label, { flexShrink: 1, textAlign: 'right' }]}>{value}</Text>
    </View>
  );
}
