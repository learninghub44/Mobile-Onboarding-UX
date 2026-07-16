import React, { useState, useRef, useCallback } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ListRenderItemInfo,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { ErrorState } from '@/components/ui/ErrorState';
import { chatWithGroq, type ChatMessage } from '@/lib/groq';
import { useOrgQuery } from '@/lib/useOrgQuery';
import { getTransactions, getLoans, getUpcomingMeeting } from '@/lib/queries';
import { formatCurrency } from '@/lib/format';
import type { Organization } from '@/context/AppContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ─── System prompt builder ────────────────────────────────────────────────────

function buildSystemPrompt(org: Organization, recentTransactions: any[], loans: any[], upcomingMeeting: any | null): string {
  const txLines = recentTransactions.slice(0, 6)
    .map(
      t =>
        `  ${new Date(t.created_at).toLocaleDateString('en-KE')}: ${t.title} — ${formatCurrency(t.amount, org.currencySymbol, org.currency)} (${t.type})`,
    )
    .join('\n');

  const loanLines = loans.map(
    l =>
      `  Member ${l.member_id}: ${formatCurrency(l.amount, org.currencySymbol, org.currency)} disbursed, ` +
      `${formatCurrency(l.balance, org.currencySymbol, org.currency)} remaining, ${l.status}`,
  ).join('\n');

  const meetingLines = upcomingMeeting
    ? `  ${upcomingMeeting.title} — ${new Date(upcomingMeeting.scheduled_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })} at ${new Date(upcomingMeeting.scheduled_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}, ${upcomingMeeting.location}`
    : '  No upcoming meetings scheduled';

  const today = new Date().toLocaleDateString('en-KE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `You are a financial AI assistant for ChamaYetu, helping leaders of African savings groups (Chamas and SACCOs) make informed financial decisions.

ORGANIZATION: ${org.name}
Type: ${org.type}
Currency: ${org.currencySymbol} (${org.currency})
Total Balance: ${formatCurrency(org.balance, org.currencySymbol, org.currency)}
Members: ${org.membersCount}
Total Contributions: ${formatCurrency(org.totalContributions, org.currencySymbol, org.currency)}
Outstanding Loans: ${formatCurrency(org.totalLoans, org.currencySymbol, org.currency)}

RECENT TRANSACTIONS:
${txLines || '  No recent transactions'}

ACTIVE LOANS:
${loanLines || '  No active loans'}

UPCOMING MEETINGS:
${meetingLines}

TODAY: ${today}

INSTRUCTIONS:
- Be concise and professional (under 250 words per response)
- Always use ${org.currencySymbol} for all currency amounts
- Speak as a knowledgeable advisor for African community savings groups
- When drafting announcements, agendas, or reminders, be professional and culturally appropriate
- Do not fabricate data — only reference the information provided above
- Support multi-turn conversation by referencing prior exchanges when relevant`;
}

// ─── Components ───────────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  'How are we tracking against our savings target?',
  'Summarize the current loan portfolio',
  'Draft a reminder for members who are behind',
  'What meetings do we have coming up?',
  'Generate a meeting agenda for the next meeting',
  'Give me a monthly financial summary',
];

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
}

function MessageBubble({
  message,
  colors,
}: {
  message: Message;
  colors: ReturnType<typeof useColors>;
}) {
  const isUser = message.role === 'user';
  return (
    <View style={[bubbleStyles.wrapper, isUser ? bubbleStyles.userWrapper : bubbleStyles.aiWrapper]}>
      {!isUser && (
        <LinearGradient
          colors={[colors.gradientCard, colors.gradientEnd]}
          style={bubbleStyles.aiAvatar}
        >
          <Feather name="cpu" size={14} color="#FFFFFF" />
        </LinearGradient>
      )}
      <View
        style={[
          bubbleStyles.bubble,
          isUser
            ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
            : {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
                borderBottomLeftRadius: 4,
              },
        ]}
      >
        <Text
          style={[
            bubbleStyles.content,
            { color: isUser ? '#FFFFFF' : colors.foreground },
          ]}
        >
          {message.content}
        </Text>
        <Text
          style={[
            bubbleStyles.time,
            {
              color: isUser ? 'rgba(255,255,255,0.55)' : colors.mutedForeground,
            },
          ]}
        >
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 8,
  },
  userWrapper: { justifyContent: 'flex-end' },
  aiWrapper: { justifyContent: 'flex-start' },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  content: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
  },
  time: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    alignSelf: 'flex-end',
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

const WELCOME_MSG: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hello! I'm your ChamaYetu AI assistant, powered by Groq. I have full context of your organization — contributions, loans, members, and meetings.\n\nHow can I help you today?",
  timestamp: new Date(),
};

export default function AIScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentOrg, orgsError, clearOrgsError } = useApp();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  // Conversation history sent to Groq (does not include welcome msg)
  const conversationRef = useRef<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState('');
  const flatListRef = useRef<FlatList<Message>>(null);
  const abortRef = useRef<AbortController | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const showSuggestions = messages.length === 1;

  const { data: recentTransactions = [] } = useOrgQuery(
    ['ai-recent-transactions'],
    (orgId) => getTransactions(orgId, { limit: 6 })
  );
  const { data: loans = [] } = useOrgQuery(
    ['ai-loans'],
    (orgId) => getLoans(orgId)
  );
  const { data: upcomingMeeting } = useOrgQuery(
    ['ai-upcoming-meeting'],
    (orgId) => getUpcomingMeeting(orgId)
  );

  if (orgsError) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}> 
        <View style={styles.errorStateWrap}>
          <ErrorState
            title="Couldn’t load your organization context"
            description={orgsError}
            actionLabel="Retry"
            onAction={clearOrgsError}
          />
        </View>
      </View>
    );
  }

  if (!currentOrg) {
    return null;
  }

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isThinking || !currentOrg) return;

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setError('');

      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setIsThinking(true);

      // Scroll to bottom
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

      // Build history for Groq
      const groqUserMsg: ChatMessage = { role: 'user', content: trimmed };
      const history = [...conversationRef.current, groqUserMsg];

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const systemPrompt = buildSystemPrompt(currentOrg, recentTransactions, loans, upcomingMeeting);
        const reply = await chatWithGroq(history, systemPrompt, ctrl.signal);

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: reply,
          timestamp: new Date(),
        };

        // Update conversation history
        conversationRef.current = [
          ...history,
          { role: 'assistant', content: reply },
        ];

        setMessages(prev => [...prev, aiMsg]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        const errText =
          err instanceof Error ? err.message : 'Unexpected error. Please try again.';
        setError(errText);
      } finally {
        setIsThinking(false);
        abortRef.current = null;
      }
    },
    [isThinking, currentOrg, recentTransactions, loans, upcomingMeeting],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.gradientCard, colors.gradientCardEnd]}
        style={[styles.header, { paddingTop: topPad + 12 }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.aiIcon}
            >
              <Feather name="cpu" size={20} color="#FFFFFF" />
            </LinearGradient>
            <View>
              <Text style={styles.headerTitle}>AI Assistant</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {currentOrg?.name ?? 'Your Organization'} · Groq
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
        {/* Error banner */}
        {error ? (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: colors.destructiveLight, borderColor: colors.destructive },
            ]}
          >
            <Feather name="alert-circle" size={14} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            <Pressable onPress={() => setError('')} hitSlop={8}>
              <Feather name="x" size={14} color={colors.destructive} />
            </Pressable>
          </View>
        ) : null}

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
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          ListFooterComponent={
            isThinking ? (
              <View style={[bubbleStyles.wrapper, bubbleStyles.aiWrapper]}>
                <LinearGradient
                  colors={[colors.gradientCard, colors.gradientEnd]}
                  style={bubbleStyles.aiAvatar}
                >
                  <Feather name="cpu" size={14} color="#FFFFFF" />
                </LinearGradient>
                <View
                  style={[
                    bubbleStyles.bubble,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      bubbleStyles.content,
                      { color: colors.mutedForeground, fontStyle: 'italic' },
                    ]}
                  >
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
                style={[
                  styles.suggestionChip,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <Text style={[styles.suggestionText, { color: colors.foreground }]}>{p}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom:
                Platform.OS === 'web' ? 34 : insets.bottom + 12,
            },
          ]}
        >
          <TextInput
            style={[
              styles.textInput,
              {
                color: colors.foreground,
                backgroundColor: colors.muted,
                borderRadius: 24,
                borderColor: colors.border,
              },
            ]}
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
                backgroundColor:
                  input.trim() && !isThinking ? colors.primary : colors.muted,
                borderRadius: 24,
              },
            ]}
          >
            <Feather
              name="send"
              size={18}
              color={
                input.trim() && !isThinking ? '#FFFFFF' : colors.mutedForeground
              }
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  errorStateWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    maxWidth: 200,
  },
  onlineDot: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  onlineIndicator: { width: 8, height: 8, borderRadius: 4 },
  onlineText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    marginBottom: 0,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  suggestionsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
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