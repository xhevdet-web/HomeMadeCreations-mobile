import { router } from 'expo-router';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Header, Page, useUI } from '@/components/common/ui';
import { useDesignStore } from '@/store/designStore';

export default function CreateScreen() {
  const ui = useUI();
  const { t } = useTranslation();
  const count = useDesignStore((state) => state.items.length);
  return <Page>
    <Header title={t('createTab.title')} />
    <Text style={ui.body}>{t('createTab.body')}</Text>
    {count > 0 && <Button title={t('createTab.continueDesign')} icon="create-outline" onPress={() => router.push('/designer')} />}
    <Button title={t('createTab.selectCategory')} icon="arrow-forward" onPress={() => router.push('/categories')} />
  </Page>;
}
