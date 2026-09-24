import { ImageBackground, Pressable, Text, View } from 'react-native';
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
        <SafeAreaView style={{ flex: 1, justifyContent: 'space-between', padding: 28, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
          <View style={{ alignItems: 'center', paddingTop: 20, gap: 18 }}>
            <View style={{ alignSelf: 'flex-end' }}><IconButton name={theme.mode === 'dark' ? 'sunny-outline' : 'moon-outline'} label={theme.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onPress={toggleTheme} /></View>
            <Brand hero />
            <Text style={{ fontSize: 14, color: theme.colors.text, letterSpacing: 2 }}>CREATOR</Text>
          </View>
          <View style={{ gap: 18, paddingBottom: 12 }}>
            <Text style={{ fontFamily: theme.fonts.editorial, fontSize: 32, color: theme.colors.text, lineHeight: 38 }}>Create.{'\n'}Customize.{'\n'}Gift Happiness.</Text>
            <Text style={{ fontSize: 14, color: theme.colors.muted, lineHeight: 21 }}>Unique handmade products designed by you.</Text>
            <Button title="Get Started" onPress={() => enter('/register')} icon="arrow-forward" />
            <Pressable accessibilityRole="button" onPress={() => enter('/login')} style={{ minHeight: 44, justifyContent: 'center' }}>
              <Text style={{ textAlign: 'center', color: theme.colors.text, fontSize: 13 }}>Already have an account? <Text style={{ fontWeight: '700' }}>Sign In</Text></Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}
