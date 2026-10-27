import { ImageBackground, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand, Button } from '@/components/common/ui';
import { LogoMark } from '@/components/common/Logo';
import { ThemeToggleButton } from '@/components/common/ThemeToggleButton';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useTheme } from '@/hooks/useTheme';

export default function WelcomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  function enter(pathname: '/login' | '/register') {
    useOnboardingStore.getState().complete();
    router.replace(pathname);
  }
  return (
    <ImageBackground source={require('../../assets/beads-editorial.png')} resizeMode="cover" style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <LinearGradient colors={theme.gradients.welcome} locations={[0, 0.5, 1]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'space-between', padding: 22, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
          <View style={{ alignItems: 'center', paddingTop: 8, gap: 24 }}>
            <View style={{ alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* New customers can switch language before signing in. */}
              <LanguageToggle />
              <ThemeToggleButton />
            </View>
            <Brand hero />
          </View>
          <View style={{ borderRadius: 26, overflow: 'hidden', borderWidth: 1,
            borderColor: theme.colors.overlayBorder,
            backgroundColor: theme.colors.overlayCard }}>
            {/* The house mark as a soft watermark behind the welcome text. */}
            <View pointerEvents="none" style={{ position: 'absolute', right: -60, bottom: -40,
              opacity: theme.mode === 'dark' ? 0.13 : 0.075 }}>
              <LogoMark size={300} tone={theme.mode === 'dark' ? 'dark' : 'light'} />
            </View>
            <View style={{ gap: 16, padding: 24 }}>
              <Text style={{ fontFamily: theme.fonts.editorial, fontSize: 32, color: theme.colors.text, lineHeight: 38 }}>{t('welcome.title')}</Text>
              <Text style={{ fontSize: 14, color: theme.colors.muted, lineHeight: 21 }}>{t('welcome.subtitle')}</Text>
              <Button title={t('welcome.getStarted')} onPress={() => enter('/register')} icon="arrow-forward" />
              <Pressable accessibilityRole="button" onPress={() => enter('/login')} style={{ minHeight: 44, justifyContent: 'center' }}>
                <Text style={{ textAlign: 'center', color: theme.colors.text, fontSize: 13 }}>{t('welcome.haveAccount')}<Text style={{ fontWeight: '700' }}>{t('welcome.signIn')}</Text></Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}
