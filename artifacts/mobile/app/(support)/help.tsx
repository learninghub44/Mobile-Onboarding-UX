import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { SupportPageLayout } from '@/components/SupportPageLayout';

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How do I create a new organization?',
    a: 'From your profile, tap "My Organizations", or go through the onboarding flow after signing up. You\'ll pick a name, type (Chama, SACCO, or Investment Group), and currency.',
  },
  {
    q: 'How do contributions and expenses work?',
    a: 'Use the Contribute and Expense quick actions on your Home tab to record transactions. Your organization\'s balance is the sum of all contributions, income, and loan repayments, minus expenses and disbursed loans.',
  },
  {
    q: 'How do I invite someone to my organization?',
    a: 'Use the Invite quick action and enter their email. It creates a pending invite — as soon as they sign up for ChamaYetu with that exact email, they automatically join your organization.',
  },
  {
    q: 'How do I request or repay a loan?',
    a: 'Use the Loan quick action to request a loan (it goes to your organization admins as pending). Use the Repay quick action to record a repayment against an existing loan.',
  },
  {
    q: 'Can I switch between multiple organizations?',
    a: 'Yes — if you belong to more than one, open your Profile tab and tap any organization under "My Organizations" to switch to it.',
  },
  {
    q: 'How do I set a monthly contribution goal?',
    a: 'On the Home tab, if your organization has no goal set yet, you\'ll see a "Set a monthly contribution goal" prompt on the balance card. Tap it to set a target.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      onPress={() => setOpen(o => !o)}
      style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
    >
      <View style={styles.itemHeader}>
        <Text style={[styles.question, { color: colors.foreground }]}>{q}</Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} />
      </View>
      {open ? <Text style={[styles.answer, { color: colors.mutedForeground }]}>{a}</Text> : null}
    </Pressable>
  );
}

export default function HelpCenterScreen() {
  return (
    <SupportPageLayout title="Help Center">
      <View style={styles.list}>
        {FAQS.map(item => (
          <FaqItem key={item.q} q={item.q} a={item.a} />
        ))}
      </View>
    </SupportPageLayout>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  item: { borderWidth: 1, padding: 16, gap: 10 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  question: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  answer: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
});
