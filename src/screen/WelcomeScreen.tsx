import { ImageBackground, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand, Button } from '@/components/common/ui';
import { useOnboardingStore } from '@/store/onboardingStore';

export default function WelcomeScreen() {
  function enter(pathname: '/login' | '/register') {
    useOnboardingStore.getState().complete();
    router.replace(pathname);
  }
  return (
    <ImageBackground source={require('../../assets/beads-editorial.png')} resizeMode="cover" style={{ flex: 1, backgroundColor: '#F2ECE2' }}>
      <LinearGradient colors={['#F9F6F080', '#F9F6F000', '#F9F6F0F5']} locations={[0, 0.5, 1]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'space-between', padding: 28, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
          <View style={{ alignItems: 'center', paddingTop: 50, gap: 18 }}>
            <Brand hero />
            <Text style={{ fontSize: 14, color: '#284E60', letterSpacing: 2 }}>Create. Express. Gift.</Text>
          </View>
          <View style={{ gap: 18, paddingBottom: 12 }}>
            <Text style={{ textAlign: 'center', fontSize: 13, color: '#284E60', lineHeight: 21 }}>Little beads. Meaningful moments.{'\n'}Something beautifully you.</Text>
            <Button title="Get Started" onPress={() => enter('/register')} icon="arrow-forward" />
            <Pressable accessibilityRole="button" onPress={() => enter('/login')} style={{ minHeight: 44, justifyContent: 'center' }}>
              <Text style={{ textAlign: 'center', color: '#284E60', fontSize: 13 }}>Already have an account? <Text style={{ fontWeight: '700' }}>Sign In</Text></Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}
