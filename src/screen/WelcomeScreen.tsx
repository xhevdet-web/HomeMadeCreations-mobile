import { Image, ImageBackground, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand, Button, IconButton } from '@/components/common/ui';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/store/themeStore';

export default function WelcomeScreen() {
  const theme = useTheme();
  const toggleTheme = useThemeStore((state) => state.toggle);
  function enter(pathname: '/login' | '/register') {
    useOnboardingStore.getState().complete();
    router.replace(pathname);
  }
  return (
    <ImageBackground source={require('../../assets/beads-editorial.png')} resizeMode="cover" style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <LinearGradient colors={theme.mode === 'dark' ? ['#171B2BE6', '#171B2B99', '#171B2BF5'] : ['#FFFFFFCC', '#FFFFFF66', '#FFFFFFF5']} locations={[0, 0.5, 1]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'space-between', padding: 22, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
          <View style={{ alignItems: 'center', paddingTop: 8, gap: 24 }}>
            <View style={{ alignSelf: 'flex-end' }}><IconButton name={theme.mode === 'dark' ? 'sunny-outline' : 'moon-outline'} label={theme.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onPress={toggleTheme} /></View>
            <Brand hero />
          </View>
          <View style={{ borderRadius: 26, overflow: 'hidden', borderWidth: 1,
            borderColor: theme.mode === 'dark' ? '#FFFFFF33' : '#FFFFFFD9',
            backgroundColor: theme.mode === 'dark' ? '#20253AEF' : '#FFFFFFEF' }}>
            <Image source={theme.mode === 'dark' ? require('../../assets/LogoDarkMode.png') : require('../../assets/Logo.png')} resizeMode="contain"
              accessibilityIgnoresInvertColors
              style={{ position: 'absolute', width: 360, height: 360, right: -72, bottom: -60,
                opacity: theme.mode === 'dark' ? 0.13 : 0.075 }} />
            <View style={{ gap: 16, padding: 24 }}>
              <Text style={{ fontFamily: theme.fonts.editorial, fontSize: 32, color: theme.colors.text, lineHeight: 38 }}>Create.{'\n'}Customize.{'\n'}Gift Happiness.</Text>
              <Text style={{ fontSize: 14, color: theme.colors.muted, lineHeight: 21 }}>Unique handmade products designed by you.</Text>
              <Button title="Get Started" onPress={() => enter('/register')} icon="arrow-forward" />
              <Pressable accessibilityRole="button" onPress={() => enter('/login')} style={{ minHeight: 44, justifyContent: 'center' }}>
                <Text style={{ textAlign: 'center', color: theme.colors.text, fontSize: 13 }}>Already have an account? <Text style={{ fontWeight: '700' }}>Sign In</Text></Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}
