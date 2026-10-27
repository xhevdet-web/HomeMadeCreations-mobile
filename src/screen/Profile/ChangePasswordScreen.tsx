import { type ComponentRef, useRef, useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useChangePasswordMutation } from '@/api/endpoints/authSlice';
import { PasswordInput } from '@/components/common/PasswordInput';
import { Button, Header, Icon, Page, useUI } from '@/components/common/ui';
import { type Theme } from '@/constants/theme';
import { passwordRequirements } from '@/helper/passwordPolicy';
import { useFeedbackState } from '@/hooks/useFeedbackState';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { toast } from '@/store/toastStore';
import { passwordChangeErrorMessage, type PasswordChange, validatePasswordChange } from '@/screen/Auth/authForm';
import { PasswordMatch, PasswordStrength } from '@/screen/Auth/components/PasswordChecks';

const empty: PasswordChange = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function ChangePasswordScreen() {
  const ui = useUI();
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const [form, setForm] = useState<PasswordChange>(empty);
  const [error, setError] = useFeedbackState();
  const [done, setDone] = useState(false);
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  // Guards double taps before the loading state re-renders.
  const sending = useRef(false);
  const newRef = useRef<ComponentRef<typeof TextInput>>(null);
  const confirmRef = useRef<ComponentRef<typeof TextInput>>(null);
  const update = (key: keyof PasswordChange) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (error) setError('');
  };

  async function submit() {
    if (sending.current) return;
    Keyboard.dismiss();
    const invalid = validatePasswordChange(form);
    if (invalid) return setError(invalid);
    sending.current = true;
    setError('');
    try {
      await changePassword(form).unwrap();
      setForm(empty);
      setDone(true);
      // Replaces any earlier error toast.
      toast.success(t('auth.changePassword.updatedToast'));
    } catch (failure) {
      setError(passwordChangeErrorMessage(failure));
    } finally {
      sending.current = false;
    }
  }

  if (done)
    return (
      <Page style={{ gap: 22 }}>
        <Header title={t('auth.changePassword.title')} back />
        <View style={[ui.card, { alignItems: 'center', paddingVertical: 32 }]} accessibilityLiveRegion="polite">
          <View style={styles.successIcon}>
            <Icon name="checkmark" size={30} color={theme.colors.success} />
          </View>
          <Text style={ui.sectionTitle} accessibilityRole="header">{t('auth.changePassword.updated')}</Text>
          <Text style={[ui.body, { textAlign: 'center' }]}>
            {t('auth.changePassword.updatedBody')}
          </Text>
        </View>
        <Button title={t('common.done')} icon="checkmark" onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))} />
      </Page>
    );

  const requirements = passwordRequirements(form.newPassword);
  return (
    <Page style={{ gap: 22 }}>
      <Header title={t('auth.changePassword.title')} back />
      <View style={{ gap: 8 }}>
        <Text style={ui.title}>{t('auth.changePassword.heading')}</Text>
        <Text style={ui.body}>{t('auth.changePassword.intro')}</Text>
      </View>

      <View style={[ui.card, { gap: 18 }]}>
        <PasswordInput label={t('auth.changePassword.current')} value={form.currentPassword}
          onChangeText={update('currentPassword')} autoComplete="current-password" textContentType="password"
          returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => newRef.current?.focus()}
          editable={!isLoading} />

        <View style={{ gap: 10 }}>
          <PasswordInput ref={newRef} label={t('auth.changePassword.new')} value={form.newPassword}
            onChangeText={update('newPassword')} autoComplete="new-password" textContentType="newPassword"
            returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => confirmRef.current?.focus()}
            editable={!isLoading} />
          <PasswordStrength password={form.newPassword} />
          <View style={{ gap: 6 }}>
            <Text style={ui.caption}>{t('auth.changePassword.requirements')}</Text>
            {requirements.map((rule) => {
              const label = t(rule.id === 'min' ? 'auth.password.ruleMin' : 'auth.password.ruleMax', { count: rule.count });
              const met = rule.met && !!form.newPassword;
              return (
              <View key={rule.id} style={styles.rule}
                accessibilityLabel={t(met ? 'auth.changePassword.ruleMet' : 'auth.changePassword.ruleNotMet', { rule: label })}>
                <Icon name={rule.met && form.newPassword ? 'checkmark-circle' : 'ellipse-outline'} size={14}
                  color={rule.met && form.newPassword ? theme.colors.success : theme.colors.muted} />
                <Text style={[ui.caption, rule.met && form.newPassword && { color: theme.colors.success }]}>
                  {label}
                </Text>
              </View>
              );
            })}
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <PasswordInput ref={confirmRef} label={t('auth.changePassword.confirm')} value={form.confirmPassword}
            onChangeText={update('confirmPassword')} autoComplete="new-password" textContentType="newPassword"
            returnKeyType="done" onSubmitEditing={() => void submit()} editable={!isLoading} />
          <PasswordMatch password={form.newPassword} confirm={form.confirmPassword} />
        </View>
      </View>

      {error ? <Text accessibilityRole="alert" style={ui.error}>{error}</Text> : null}
      <Button title={t('auth.changePassword.submit')} icon="lock-closed-outline" loading={isLoading} disabled={isLoading}
        onPress={() => void submit()} />
      <Text style={[ui.caption, { textAlign: 'center' }]}>
        {t('auth.changePassword.staySignedIn')}
      </Text>
    </Page>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  rule: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  successIcon: {
    width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.successSurface,
  },
});
