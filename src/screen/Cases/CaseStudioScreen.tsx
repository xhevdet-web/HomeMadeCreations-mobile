import { useCallback, useRef, useState, type ComponentRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Header, IconButton, Notice, Page, useUI } from '@/components/common/ui';
import { StageBackground } from '@/components/common/StageBackground';
import { CatalogState } from '@/components/products/CatalogState';
import { useGetCategoryByIdQuery } from '@/api/endpoints/categorySlice';
import { useGetCategoryComponentsQuery } from '@/api/endpoints/subCategorySlice';
import { useCreateProductMutation, useGetProductsQuery } from '@/api/endpoints/productSlice';
import { apiError } from '@/api/apiSlice';
import { useApiResult } from '@/api/useApiResult';
import type { CatalogCategory, CatalogComponent } from '@/api/catalogModels';
import { CUSTOM_UPLOAD } from '@/api/builderModels';
import { caseTemplateOf, type CaseModel } from '@/api/caseModels';
import { useCaseStore } from '@/store/caseStore';
import { useAuthStore } from '@/store/authStore';
import { useCommerceStore } from '@/store/commerceStore';
import { toast } from '@/store/toastStore';
import { useFeedbackState } from '@/hooks/useFeedbackState';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { DEFAULT_TRANSFORM, isLowQuality, type Size } from '@/helper/caseStudio';
import { money } from '@/helper/pricing';
import { captureViewPreview } from '@/services/designPreview';
import { saveCaseDesign } from '@/services/caseDesign';
import { type Theme } from '@/constants/theme';
import { CaseCanvas, useImageAspect } from './components/CaseCanvas';
import { CaseDesignPicker } from './components/CaseDesignPicker';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const frames = (count: number) => new Promise<void>((resolve) => {
  const step = (left: number) => (left ? requestAnimationFrame(() => step(left - 1)) : resolve());
  step(count);
});

/**
 * Cases, step 2: one image on the chosen phone. Upload a photo or pick a design, fit it
 * inside the case (drag, pinch, rotate), preview, then save and order. The case is the
 * focus; every control appears only when it is useful.
 */
export default function CaseStudioScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const ui = useUI();
  const styles = useThemedStyles(createStyles);
  const { width, height } = useWindowDimensions();
  const draft = useCaseStore();
  const categoryId = draft.categoryId ?? '';
  const category = useApiResult<CatalogCategory>(useGetCategoryByIdQuery(categoryId, { skip: !categoryId }));
  const models = useApiResult<CaseModel[]>(
    useGetProductsQuery({ categoryId, origin: 'COMPANY' }, { skip: !categoryId }));
  const designsResult = useApiResult<CatalogComponent[]>(
    useGetCategoryComponentsQuery(categoryId, { skip: !categoryId }));
  const [createProduct] = useCreateProductMutation();
  const [message, setMessage] = useFeedbackState('info');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState<'save' | 'order' | null>(null);
  const [capturing, setCapturing] = useState(false);
  const canvasRef = useRef<ComponentRef<typeof View>>(null);

  const model = models.data?.find((entry) => entry.id === draft.modelId);
  const template = caseTemplateOf(model);
  const aspect = useImageAspect(template.imageUrl);
  const all = designsResult.data ?? [];
  // The admin's "Your own photo" is offered as the upload, not as a library design.
  const ownPhoto = all.find((design) => design.type?.toUpperCase() === CUSTOM_UPLOAD);
  const designs = all.filter((design) => design !== ownPhoto);
  const artwork = draft.artwork;
  const chosen = artwork ? all.find((design) => design.id === artwork.subCategoryId) : undefined;
  const imageUri = artwork?.imageUri ?? chosen?.imageUrl ?? null;
  const uploaded = !!artwork?.imageUri;
  const onImageSize = useCallback((size: Size) => useCaseStore.getState().setImageSize(size), []);

  // The case gets most of the screen; the preview gets a little more.
  const budget = Math.min(height * (mode === 'preview' ? 0.58 : 0.46), 540);
  const canvasWidth = Math.min(budget / aspect, Math.min(width, 760) - 64);
  const areaAspect = (template.area.height * aspect) / template.area.width;
  const lowQuality = uploaded && isLowQuality(artwork?.imageSize, areaAspect, artwork?.scale ?? 1);
  const soldOut = !!model && (model.stock ?? 0) < 1;
  const designPrice = chosen?.price ?? 0;
  const total = (model?.price ?? 0) + designPrice;
  const changeModel = () => router.push({ pathname: '/case-model', params: { categoryId, edit: '1' } });

  async function upload() {
    if (!ownPhoto) return;
    // The system photo picker needs no permission prompt. Re-encoding at 0.8 turns HEIC
    // into JPEG and keeps phone photos well under the 5 MB upload limit.
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return;
    if (!isSupportedPhoto(asset)) {
      toast.error(t('cases.studio.unsupportedPhoto'));
      return;
    }
    if (asset.fileSize && asset.fileSize > MAX_PHOTO_BYTES) {
      toast.error(t('cases.studio.photoTooLarge'));
      return;
    }
    draft.choose({
      subCategoryId: ownPhoto.id,
      imageUri: asset.uri,
      imageSize: asset.width && asset.height ? { width: asset.width, height: asset.height } : null,
    });
    setPicking(false);
    setMessage('');
  }

  function chooseDesign(design: CatalogComponent) {
    draft.choose({ subCategoryId: design.id, imageSize: null });
    setPicking(false);
    setMessage('');
  }

  function usePhoto() {
    if (!draft.photo) return;
    draft.choose(draft.photo);
    setPicking(false);
  }

  // Takes the image off the case; an uploaded photo stays offered as "Use my photo again".
  function removeImage() {
    draft.clear();
    setPicking(false);
    toast.info(t('cases.studio.imageRemoved'));
  }

  function step(patch: { scale?: number; rotation?: number }) {
    if (!artwork) return;
    draft.transform({
      ...artwork,
      scale: artwork.scale * (patch.scale ?? 1),
      rotation: artwork.rotation + (patch.rotation ?? 0),
    });
  }

  async function capture() {
    setCapturing(true);
    try {
      await frames(3);
      return await captureViewPreview(canvasRef.current as unknown as View | null,
        [imageUri, template.imageUrl, template.overlayImageUrl],
        { format: 'png', pixels: 600, aspect });
    } finally {
      setCapturing(false);
    }
  }

  async function save(order: boolean) {
    const user = useAuthStore.getState().user;
    if (!user) { router.push('/login'); return; }
    if (!category.data || !model || busy) return;
    if (!artwork) { toast.info(t('cases.errors.addDesign')); return; }
    setBusy(order ? 'order' : 'save');
    setMessage('');
    try {
      const product = await saveCaseDesign(user.id, category.data.id, capture,
        (formData) => createProduct(formData).unwrap());
      if (order) {
        useCommerceStore.getState().setCheckout(user.id, product);
        router.push('/checkout');
      } else {
        toast.success(t('studio.savedToDesigns'));
      }
    } catch (failure) {
      setMessage(t('studio.stillHere', { message: apiError(failure).message }), 'error');
    } finally {
      setBusy(null);
    }
  }

  if (!category.data || !models.data)
    return (
      <Page>
        <Header title={t('cases.studio.title')} back />
        {categoryId ? (
          <CatalogState loading={category.loading || models.loading} error={category.error || models.error}
            empty={t('category.unavailable')} retry={models.retry} />
        ) : (
          <Text style={ui.body}>{t('apparel.chooseCategory')}</Text>
        )}
      </Page>
    );

  if (!model)
    return (
      <Page style={{ gap: 16 }}>
        <Header title={t('cases.studio.title')} back />
        <Notice text={draft.modelId ? t('cases.modelUnavailable') : t('cases.errors.chooseModel')} />
        <Button title={t('cases.choosePhone')} icon="phone-portrait-outline" onPress={changeModel} />
      </Page>
    );

  const preview = mode === 'preview';
  const showPicker = !preview && (!artwork || picking);
  const designName = uploaded ? t('cases.ownPhoto') : chosen?.name;

  return (
    <Page scroll={false} style={{ padding: 0, gap: 0 }}
      footer={
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <View style={styles.footerInner}>
            {preview ? (
              <>
                <View style={{ flex: 1 }}>
                  <Button title={t('cases.studio.edit')} icon="create-outline" secondary
                    onPress={() => setMode('edit')} disabled={!!busy} />
                </View>
                <View style={{ flex: 1.4 }}>
                  <Button title={soldOut ? t('readyMade.outOfStock') : t('cases.studio.order')}
                    icon={soldOut ? undefined : 'bag-check-outline'} loading={busy === 'order'}
                    disabled={!!busy || soldOut} onPress={() => void save(true)} />
                </View>
              </>
            ) : (
              <>
                <View style={{ flex: 1 }}>
                  <Text style={ui.caption} numberOfLines={1}>{t('common.total')}</Text>
                  <Text style={styles.total}>{money(total)}</Text>
                </View>
                <Button title={t('cases.studio.preview')} icon="eye-outline" disabled={!artwork || !!busy}
                  onPress={() => { setPicking(false); setMode('preview'); }} />
              </>
            )}
          </View>
        </SafeAreaView>
      }>
      <View style={styles.headerWrap}>
        <Header title={preview ? t('cases.studio.previewTitle') : t('cases.studio.title')} back
          right={<IconButton name="bookmark-outline" label={t('studio.saveDesign')}
            onPress={() => void save(false)} disabled={!artwork || !!busy} />} />
      </View>

      <View style={styles.modelRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.modelName} numberOfLines={1}>{model.name}</Text>
          {soldOut && <Text style={ui.error}>{t('readyMade.outOfStock')}</Text>}
        </View>
        {!preview && (
          <Pressable accessibilityRole="button" onPress={changeModel} hitSlop={8}>
            <Text style={ui.textLink}>{t('cases.changeModel')}</Text>
          </Pressable>
        )}
      </View>

      <View style={[styles.stage, { paddingVertical: 14 }]}>
        <StageBackground />
        <View ref={canvasRef} collapsable={false} testID="design-preview-canvas">
          <CaseCanvas
            template={template}
            width={canvasWidth}
            aspect={aspect}
            imageUri={imageUri}
            imageSize={artwork?.imageSize}
            transform={artwork ?? DEFAULT_TRANSFORM}
            editable={!preview && !capturing}
            guides={!preview && !capturing}
            onChange={draft.transform}
            onAdd={ownPhoto ? () => void upload() : undefined}
            onImageSize={onImageSize}
            onImageError={() => toast.error(t('cases.studio.imageFailed'))}
          />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {preview ? (
          <View style={[ui.card, styles.summary]}>
            <View style={ui.between}>
              <Text style={ui.body}>{t('cases.studio.caseLine', { name: model.name })}</Text>
              <Text style={ui.label}>{money(model.price)}</Text>
            </View>
            {!!designName && (
              <View style={ui.between}>
                <Text style={[ui.body, { flex: 1 }]} numberOfLines={1}>{designName}</Text>
                <Text style={ui.label}>{money(designPrice)}</Text>
              </View>
            )}
            <View style={ui.divider} />
            <View style={ui.between}>
              <Text style={styles.totalLabel}>{t('common.total')}</Text>
              <Text style={styles.totalValue}>{money(total)}</Text>
            </View>
            <Text style={ui.caption}>{t('cases.studio.previewNote')}</Text>
          </View>
        ) : showPicker ? (
          <View style={{ gap: 12 }}>
            <View style={ui.between}>
              <Text style={styles.sectionTitle}>{t('cases.studio.yourDesign')}</Text>
              {artwork && (
                <Pressable accessibilityRole="button" onPress={() => setPicking(false)} hitSlop={8}>
                  <Text style={ui.textLink}>{t('common.cancel')}</Text>
                </Pressable>
              )}
            </View>
            {designsResult.loading || designsResult.error ? (
              <CatalogState loading={designsResult.loading} error={designsResult.error} empty=""
                retry={designsResult.retry} />
            ) : (
              <CaseDesignPicker designs={designs} selectedId={uploaded ? null : artwork?.subCategoryId}
                uploadPrice={ownPhoto?.price ?? 0} canUpload={!!ownPhoto}
                hasPhoto={!!draft.photo && !uploaded} onUpload={() => void upload()} onUsePhoto={usePhoto}
                onChoose={chooseDesign} />
            )}
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <Text style={[ui.caption, { textAlign: 'center' }]}>{t('cases.studio.gestureHint')}</Text>
            <View style={styles.tools}>
              <IconButton name="remove-outline" label={t('cases.studio.zoomOut')} onPress={() => step({ scale: 0.9 })} />
              <IconButton name="add-outline" label={t('cases.studio.zoomIn')} onPress={() => step({ scale: 1.1 })} />
              <IconButton name="arrow-undo-outline" label={t('cases.studio.rotateLeft')}
                onPress={() => step({ rotation: -15 })} />
              <IconButton name="arrow-redo-outline" label={t('cases.studio.rotateRight')}
                onPress={() => step({ rotation: 15 })} />
              <IconButton name="trash-outline" label={t('cases.studio.removeImage')} onPress={removeImage} />
            </View>
            <View style={styles.actions}>
              <View style={{ flex: 1 }}>
                <Button title={t('cases.studio.reset')} icon="refresh-outline" secondary onPress={draft.reset} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title={t('cases.studio.changeImage')} icon="images-outline" secondary
                  onPress={() => setPicking(true)} />
              </View>
            </View>
            {lowQuality && (
              <View style={[styles.warning, { borderColor: theme.colors.danger }]} accessibilityRole="alert">
                <Text style={[ui.label, { color: theme.colors.danger }]}>{t('cases.studio.lowQuality')}</Text>
                <Text style={ui.caption}>{t('cases.studio.lowQualityDescription')}</Text>
              </View>
            )}
            <Text style={ui.caption}>{t('cases.studio.safeAreaDescription')}</Text>
          </View>
        )}
        {message ? <Notice text={message} /> : null}
      </ScrollView>
    </Page>
  );
}

const createStyles = (theme: Theme) => {
  const c = theme.colors;
  return StyleSheet.create({
    headerWrap: { paddingHorizontal: 22, paddingTop: 4 },
    content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 14, width: '100%', maxWidth: 760,
      alignSelf: 'center' },
    modelRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingBottom: 8,
      width: '100%', maxWidth: 760, alignSelf: 'center',
    },
    modelName: { color: c.text, fontSize: 17, fontWeight: '600' },
    stage: {
      marginHorizontal: 16, borderRadius: 28, overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: c.border, backgroundColor: c.thumbnail,
    },
    sectionTitle: { color: c.text, fontSize: 16, fontWeight: '600' },
    tools: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
    actions: { flexDirection: 'row', gap: 10 },
    warning: { gap: 2, padding: 12, borderRadius: 14, borderWidth: 1, backgroundColor: c.surface },
    summary: { padding: 16, gap: 10 },
    totalLabel: { color: c.text, fontSize: 16, fontWeight: '600' },
    totalValue: { color: c.accent, fontSize: 21, fontWeight: '600' },
    footer: { borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.bottomBar },
    footerInner: {
      flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', maxWidth: 760,
      alignSelf: 'center', paddingHorizontal: 22, paddingVertical: 10,
    },
    total: { color: c.text, fontSize: 20, fontWeight: '600' },
  });
};

/** JPEG, PNG or WebP by type, else by file name; the API checks the file itself too. */
function isSupportedPhoto(asset: ImagePicker.ImagePickerAsset) {
  if (asset.mimeType) return PHOTO_TYPES.includes(asset.mimeType.toLowerCase());
  return /\.(jpe?g|png|webp)$/i.test(asset.fileName ?? asset.uri.split('?')[0]);
}
