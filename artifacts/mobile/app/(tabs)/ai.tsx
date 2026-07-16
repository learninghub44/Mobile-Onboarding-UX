import React, { useState, useRef, useCallback } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ListRenderItemInfo,
  ScrollView,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  'How much have we contributed this year?',
  'Show members with outstanding loans',
  'Summarize last month\'s expenses',
  'What meetings are scheduled?',
  'Generate a meeting agenda',
  'Explain our contribution trends',
];

function getMockResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('contribut')) {
    return 'Based on the Umoja Investment Group records, the group has collected KSh 88,000 this month (July 2026), which is 63% of the monthly target of KSh 120,000.\n\nYear-to-date contributions total KSh 960,000 across all 24 members. 3 members are currently behind on their July contributions: James Mwangi, Alice Muthoni, and Robert Waweru.\n\nWould you like me to draft reminder messages for members who are behind?';
  }
  if (lower.includes('loan')) {
    return 'Umoja Investment Group currently has 3 active loans:\n\n1. James Mwangi — KSh 45,000 disbursed July 14, 2026. Balance: KSh 38,250 (15% repaid)\n2. Alice Muthoni — KSh 30,000 disbursed July 8, 2026. Balance: KSh 30,000 (just started)\n3. Grace Otieno — KSh 60,000 disbursed April 1, 2026. Balance: KSh 17,000 (72% repaid — on track)\n\nTotal outstanding: KSh 85,250. No loans are currently overdue.';
  }
  if (lower.includes('meeting') || lower.includes('agenda')) {
    return 'Your next meeting is the Monthly General Meeting on Saturday, July 26, 2026 at 2:00 PM at Nairobi Serena Hotel, Boardroom A.\n\nHere is a suggested agenda:\n\n1. Call to order and attendance register (5 min)\n2. Confirmation of June 2026 minutes (5 min)\n3. Treasurer\'s report — KSh 1,245,000 balance (15 min)\n4. Loan applications — 1 pending for review (10 min)\n5. Investment committee progress update (10 min)\n6. Upcoming events and member reminders (5 min)\n7. Any other business (10 min)\n8. Closure and date of next meeting\n\nShall I refine this agenda or add specific agenda items?';
  }
  if (lower.includes('member')) {
    return 'Umoja Investment Group has 24 members in total:\n\n• 20 active members\n• 1 inactive member (Robert Waweru — last contribution was 3 months ago)\n• 3 members with pending invitations\n\nContribution status this month:\n• 21 members are up to date\n• 3 members are behind: James Mwangi, Alice Muthoni, Robert Waweru\n\nWould you like me to draft a gentle reminder message for members who are behind?';
  }
  if (lower.includes('expense')) {
    return 'July 2026 Expenses for Umoja Investment Group:\n\n• Meeting Venue (AGM) — KSh 12,000 on July 10, 2026\n\nTotal expenses this month: KSh 12,000\nMonthly budget: KSh 15,000 (80% utilized)\nYear-to-date expenses: KSh 54,500\n\nBreakdown by category:\n• Venue and meetings: 89% of expenses\n• Administrative: 11% of expenses\n\nYour expenses are well within budget. Compared to last month, expenses are down 18%.';
  }
  if (lower.includes('summary') || lower.includes('report') || lower.includes('balance') || lower.includes('trend')) {
    return 'Umoja Investment Group — Financial Summary (July 2026)\n\nTotal Balance: KSh 1,245,000\nTotal Contributions (all time): KSh 960,000\nActive Loans Outstanding: KSh 380,000\nInvestment Returns (Q2): KSh 18,500\nExpenses (MTD): KSh 12,000\n\nKey highlights:\n• The group\'s balance has grown 8.2% compared to July 2025\n• Savings target of KSh 1.5M is 83% achieved\n• Loan repayment rate is 94% — excellent financial discipline\n• 3 of 24 members require follow-up on contributions\n\nOverall, the group is in strong financial health. Shall I generate a full PDF report?';
  }
  if (lower.includes('remind') || lower.includes('draft') || lower.includes('announc')) {
    return 'Here is a draft announcement you can customize and send:\n\n---\nDear Umoja Investment Group Members,\n\nThis is a friendly reminder that our Monthly General Meeting is scheduled for Saturday, July 26, 2026 at 2:00 PM at Nairobi Serena Hotel, Boardroom A.\n\nAgenda highlights: Treasurer\'s report, loan applications, and investment updates.\n\nKindly confirm your attendance by July 24. Members with outstanding July contributions are requested to clear them before the meeting.\n\nBest regards,\nUmoja Investment Group Secretariat\n---\n\nWould you like me to adjust the tone or add any specific items?';
  }
  return 'I can help you with information about contributions, loans, members, meetings, financial summaries, and drafting announcements for Umoja Investment Group. What would you like to know?';
}

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'Hello! I\'m your CHAMA-HUB AI assistant. I have full context of your Umoja Investment Group — contributions, loans, members, and meetings.\n\nHow can I help you today?',
  timestamp: new Date(),
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
}

function MessageBubble({ message, colors }: { message: Message; colors: ReturnType<typeof useColors> }) {
  const isUser = message.role === 'user';
  return (
    <View style={[bubbleStyles.wrapper, isUser ? bubbleStyles.userWrapper : bubbleStyles.assistantWrapper]}>
      {!isUser && (
        <LinearGradient
          colors={[colors.gradientCard, colors.gradientEnd]}
          style={bubbleStyles.aiAvatar}
        >
          <Feather name="cpu" size={14} color="#FFFFFF" />
        </LinearGradient>
      )}
      <View style={[
        bubbleStyles.bubble,
        isUser
          ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
          : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 4 },
      ]}>
        <Text style={[bubbleStyles.content, { color: isUser ? '#FFFFFF' : colors.foreground }]}>
          {message.content}
        </Text>
        <Text style={[bubbleStyles.time, { color: isUser ? 'rgba(255,255,255,0.55)' : colors.mutedForeground }]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, gap: 8 },
  userWrapper: { justifyContent: 'flex-end' },
  assistantWrapper: { justifyContent: 'flex-start' },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubble: { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, gap: 4 },
  content: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  time: { fontFamily: 'Inter_400Regular', fontSize: 10, alignSelf: 'flex-end' },
});

export default function AIScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentOrg } = useApp();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const flatListRef = useRef<FlatList<Message>>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const showSuggestions = messages.length === 1;

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getMockResponse(trimmed),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsThinking(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1200);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.gradientCard, colors.gradientCardEnd]}
        style={[styles.header, { paddingTop: topPad + 12 }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <LinearGradient colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']} style={styles.aiIcon}>
              <Feather name="cpu" size={20} color="#FFFFFF" />
            </LinearGradient>
            <View>
              <Text style={styles.headerTitle}>AI Assistant</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {currentOrg?.name ?? 'Your Organization'}
              </Text>
            </View>
          </View>
          <View style={styles.onlineDot}>
            <View style={[styles.onlineIndicator, { backgroundColor: colors.success }]} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView behavior="padding" style={styles.flex} keyboardVerticalOffset={0}>
        {/* Messages */}
        <FlatList<Message>
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }: ListRenderItemInfo<Message>) => (
            <MessageBubble message={item} colors={colors} />
          )}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={
            isThinking ? (
              <View style={[bubbleStyles.wrapper, bubbleStyles.assistantWrapper]}>
                <LinearGradient colors={[colors.gradientCard, colors.gradientEnd]} style={bubbleStyles.aiAvatar}>
                  <Feather name="cpu" size={14} color="#FFFFFF" />
                </LinearGradient>
                <View style={[bubbleStyles.bubble, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                  <Text style={[bubbleStyles.content, { color: colors.mutedForeground, fontStyle: 'italic' }]}>
                    Thinking...
                  </Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Suggested prompts */}
        {showSuggestions && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsScroll}
            style={{ flexShrink: 0 }}
          >
            {SUGGESTED_PROMPTS.map(p => (
              <Pressable
                key={p}
                onPress={() => sendMessage(p)}
                style={[styles.suggestionChip, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
              >
                <Text style={[styles.suggestionText, { color: colors.foreground }]}>{p}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Input bar */}
        <View style={[
          styles.inputBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 12,
          },
        ]}>
          <TextInput
            style={[styles.textInput, { color: colors.foreground, backgroundColor: colors.muted, borderRadius: 24, borderColor: colors.border }]}
            placeholder="Ask about your organization..."
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
          />
          <Pressable
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isThinking}
            style={[
              styles.sendBtn,
              {
                backgroundColor: input.trim() && !isThinking ? colors.primary : colors.muted,
                borderRadius: 24,
              },
            ]}
          >
            <Feather name="send" size={18} color={input.trim() && !isThinking ? '#FFFFFF' : colors.mutedForeground} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, color: '#FFFFFF' },
  headerSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.65)', maxWidth: 180 },
  onlineDot: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  onlineIndicator: { width: 8, height: 8, borderRadius: 4 },
  onlineText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  messagesList: { paddingHorizontal: 16, paddingVertical: 16, flexGrow: 1 },
  suggestionsScroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    flexShrink: 0,
  },
  suggestionText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    maxHeight: 120,
    borderWidth: 1,
  },
  sendBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
