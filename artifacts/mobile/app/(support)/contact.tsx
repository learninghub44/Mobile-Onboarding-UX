import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { SupportPageLayout, SupportSection } from '@/components/SupportPageLayout';

const SUPPORT_EMAIL = 'support@chamayetu.app';

function ContactRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.accent + '15' }]}>
        <Feather name={icon} size={17} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text>
      </View>
      <Feather name="external-link" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function ContactSupportScreen() {
  const { user, currentOrg } = useApp();

  const subject = encodeURIComponent('ChamaYetu Support Request');
  const body = encodeURIComponent(
    `\n\n---\nAccount: ${user?.email ?? 'n/a'}\nOrganization: ${currentOrg?.name ?? 'n/a'}`,
  );

  return (
    <SupportPageLayout title="Contact Support">
      <SupportSection>
        Reach out and we'll get back to you as soon as we can. Including your organization name helps us help you faster.
      </SupportSection>

      <View style={styles.list}>
        <ContactRow
          icon="mail"
          label="Email us"
          value={SUPPORT_EMAIL}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`)}
        />
        <ContactRow
          icon="message-circle"
          label="WhatsApp"
          value="Chat with our team"
          onPress={() => Linking.openURL('https://wa.me/254700000000')}
        />
      </View>
    </SupportPageLayout>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderWidth: 1 },
  rowIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  rowValue: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 2 },
});
