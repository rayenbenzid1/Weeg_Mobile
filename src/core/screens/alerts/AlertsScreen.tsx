import { useEffect, useMemo, useState } from 'react';
import {
    AppState, View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal,
    ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { NotificationItem, NotificationsService } from '../../lib/api';

type SeverityFilter = 'all' | 'critical' | 'medium' | 'low';
type ReadFilter = 'all' | 'unread' | 'read';

const SEV_COLORS: Record<'critical' | 'medium' | 'low', string> = {
  critical: '#dc2626',
  medium: '#f59e0b',
  low: '#16a34a',
};

const SEV_BG: Record<'critical' | 'medium' | 'low', string> = {
  critical: '#fee2e2',
  medium: '#fef3c7',
  low: '#dcfce7',
};

const ALERT_LABELS: Record<NotificationItem['alert_type'], string> = {
  low_stock: 'Low stock',
  overdue: 'Overdue payment',
  risk: 'Credit risk',
  sales_drop: 'Sales drop',
  high_receivables: 'High receivables',
  dso: 'DSO alert',
  concentration: 'Client concentration',
  churn: 'Churn',
  anomaly: 'Anomaly',
  scheduled_report: 'Scheduled report',
  system: 'System',
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function severityIcon(severity: NotificationItem['severity']): any {
  switch (severity) {
    case 'critical': return 'warning';
    case 'medium': return 'alert-circle';
    default: return 'information-circle';
  }
}

function isPrimitive(value: any): boolean {
  return ['string', 'number', 'boolean'].includes(typeof value);
}

function humanizeKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function formatPrimitive(value: string | number | boolean): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function MetadataValue({ value, level = 0 }: { value: any; level?: number }) {
  if (value == null) {
    return <Text style={dm.metaValue}>-</Text>;
  }

  if (isPrimitive(value)) {
    return <Text style={dm.metaValue}>{formatPrimitive(value)}</Text>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <Text style={dm.metaValue}>No items</Text>;
    }

    if (value.every((item) => isPrimitive(item))) {
      return (
        <View style={dm.arrayWrap}>
          {value.map((item, index) => (
            <View key={`${String(item)}-${index}`} style={dm.arrayChip}>
              <Text style={dm.arrayChipTxt}>{formatPrimitive(item as string | number | boolean)}</Text>
            </View>
          ))}
        </View>
      );
    }

    return (
      <View style={dm.nestedBox}>
        {value.map((item, index) => (
          <View key={index} style={dm.nestedItem}>
            <Text style={dm.nestedTitle}>Item {index + 1}</Text>
            <MetadataValue value={item} level={level + 1} />
          </View>
        ))}
      </View>
    );
  }

  const entries = Object.entries(value as Record<string, any>);
  if (entries.length === 0) {
    return <Text style={dm.metaValue}>No data</Text>;
  }

  return (
    <View style={dm.nestedBox}>
      {entries.map(([key, nestedValue]) => (
        <View key={`${level}-${key}`} style={dm.metaRowEntry}>
          <Text style={dm.metaKey}>{humanizeKey(key)}</Text>
          <MetadataValue value={nestedValue} level={level + 1} />
        </View>
      ))}
    </View>
  );
}

function NotificationDetailModal({
  notification,
  onClose,
  onMarkRead,
  onDelete,
}: {
  notification: NotificationItem | null;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (!notification) return null;

  const severityColor = SEV_COLORS[notification.severity];
  const typeLabel = ALERT_LABELS[notification.alert_type] ?? notification.alert_type;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: Colors.gray50 }}>
        <View style={dm.header}>
          <View style={[dm.sevIcon, { backgroundColor: SEV_BG[notification.severity] }]}>
            <Ionicons name={severityIcon(notification.severity)} size={22} color={severityColor} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={[dm.badge, { backgroundColor: severityColor }]}>
              <Text style={dm.badgeTxt}>{notification.severity.toUpperCase()}</Text>
            </View>
            <Text style={dm.title}>{notification.title}</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color={Colors.gray500} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 28 }}>
          <View style={[dm.card, Shadow.sm]}>
            <View style={dm.metaRow}>
              <View style={dm.metaItem}>
                <Ionicons name="pricetag-outline" size={14} color={Colors.gray500} />
                <Text style={dm.metaTxt}>{typeLabel}</Text>
              </View>
              <View style={dm.metaItem}>
                <Ionicons name="time-outline" size={14} color={Colors.gray500} />
                <Text style={dm.metaTxt}>{formatDate(notification.created_at)}</Text>
              </View>
            </View>

            <Text style={dm.message}>{notification.message}</Text>

            {notification.detail ? (
              <View style={dm.detailBox}>
                <Text style={dm.detailTitle}>Details</Text>
                <Text style={dm.detailText}>{notification.detail}</Text>
              </View>
            ) : null}

            {notification.metadata && Object.keys(notification.metadata).length > 0 ? (
              <View style={dm.detailBox}>
                <Text style={dm.detailTitle}>Context</Text>
                <View style={dm.metaGrid}>
                  {Object.entries(notification.metadata).map(([key, value]) => (
                    <View key={key} style={dm.metaRowEntry}>
                      <Text style={dm.metaKey}>{humanizeKey(key)}</Text>
                      <MetadataValue value={value} />
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={dm.footer}>
          <TouchableOpacity
            style={dm.cancelBtn}
            onPress={onClose}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.foreground }}>Close</Text>
          </TouchableOpacity>

          {!notification.is_read && (
            <TouchableOpacity onPress={() => onMarkRead(notification.id)}>
              <LinearGradient colors={[Colors.indigo600, Colors.violet600]} style={dm.actionBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={dm.actionBtnTxt}>Mark as read</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              Alert.alert('Delete notification', 'This notification will be removed permanently.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => onDelete(notification.id) },
              ]);
            }}
          >
            <View style={dm.deleteBtn}>
              <Ionicons name="trash-outline" size={16} color={Colors.red} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      {active ? (
        <LinearGradient colors={[Colors.indigo600, Colors.violet600]} style={as.chipActive} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={as.chipActiveTxt}>{label}</Text>
        </LinearGradient>
      ) : (
        <View style={as.chipInactive}>
          <Text style={as.chipInactiveTxt}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function AlertsScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<NotificationItem | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');

  const loadNotifications = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);

    const params: Record<string, any> = { page_size: 100, auto_detect: true };
    if (severityFilter !== 'all') params.severity = severityFilter;
    if (readFilter !== 'all') params.is_read = readFilter === 'read';

    const res = await NotificationsService.listNotifications(params);
    if (!res.ok || !res.data) {
      setError(res.error || 'Unable to load notifications.');
      setNotifications([]);
    } else {
      setNotifications(res.data.results || []);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [severityFilter, readFilter]);

  useEffect(() => {
    const timer = setInterval(() => {
      loadNotifications(true);
    }, 15_000);

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        loadNotifications(true);
      }
    });

    return () => {
      clearInterval(timer);
      appStateSub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [severityFilter, readFilter]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  const counts = useMemo(() => ({
    critical: notifications.filter((item) => item.severity === 'critical' && !item.is_read).length,
    medium: notifications.filter((item) => item.severity === 'medium' && !item.is_read).length,
    low: notifications.filter((item) => item.severity === 'low' && !item.is_read).length,
  }), [notifications]);

  const markRead = async (id: string) => {
    const res = await NotificationsService.markRead([id]);
    if (!res.ok) {
      Alert.alert('Error', res.error || 'Failed to mark notification as read.');
      return;
    }

    setNotifications((current) => current.map((item) => (
      item.id === id ? { ...item, is_read: true, read_at: new Date().toISOString() } : item
    )));
    setSelected((current: NotificationItem | null) => (current?.id === id ? { ...current, is_read: true, read_at: new Date().toISOString() } : current));
  };

  const deleteNotification = async (id: string) => {
    const res = await NotificationsService.deleteNotification(id);
    if (!res.ok) {
      Alert.alert('Error', res.error || 'Failed to delete notification.');
      return;
    }

    setNotifications((current) => current.filter((item) => item.id !== id));
    setSelected((current: NotificationItem | null) => (current?.id === id ? null : current));
  };

  const markAllRead = async () => {
    const res = await NotificationsService.markRead();
    if (!res.ok) {
      Alert.alert('Error', res.error || 'Failed to mark notifications as read.');
      return;
    }

    setNotifications((current) => current.map((item) => ({ ...item, is_read: true, read_at: item.read_at || new Date().toISOString() })));
  };

  const visibleNotifications = notifications;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray50 }}>
      {selected && (
        <NotificationDetailModal
          notification={selected}
          onClose={() => setSelected(null)}
          onMarkRead={markRead}
          onDelete={deleteNotification}
        />
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadNotifications(true);
            }}
            tintColor={Colors.blue}
          />
        }
      >
        <View style={{ padding: Spacing.base, paddingBottom: 32 }}>
          <View style={as.hero}>
            <View style={as.heroTopRow}>
              <View>
                <Text style={as.title}>Notifications</Text>
                <Text style={as.sub}>Track alerts, read status, and action history.</Text>
              </View>

              {unreadCount > 0 ? (
                <TouchableOpacity onPress={markAllRead}>
                  <LinearGradient colors={[Colors.indigo600, Colors.violet600]} style={as.markAllBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Ionicons name="checkmark-done-outline" size={14} color="#fff" />
                    <Text style={as.markAllTxt}>Mark all read</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={as.summaryRow}>
              {[
                { label: 'Critical', value: counts.critical, color: SEV_COLORS.critical, bg: SEV_BG.critical, icon: 'warning' },
                { label: 'Medium', value: counts.medium, color: SEV_COLORS.medium, bg: SEV_BG.medium, icon: 'alert-circle' },
                { label: 'Low', value: counts.low, color: SEV_COLORS.low, bg: SEV_BG.low, icon: 'information-circle' },
              ].map((item) => (
                <View key={item.label} style={[as.summaryCard, Shadow.sm]}>
                  <View style={[as.summaryIcon, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon as any} size={18} color={item.color} />
                  </View>
                  <Text style={[as.summaryCount, { color: item.color }]}>{item.value}</Text>
                  <Text style={as.summaryLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
              <FilterChip label="All" active={severityFilter === 'all'} onPress={() => setSeverityFilter('all')} />
              <FilterChip label="Critical" active={severityFilter === 'critical'} onPress={() => setSeverityFilter('critical')} />
              <FilterChip label="Medium" active={severityFilter === 'medium'} onPress={() => setSeverityFilter('medium')} />
              <FilterChip label="Low" active={severityFilter === 'low'} onPress={() => setSeverityFilter('low')} />
            </View>
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
              <FilterChip label="All status" active={readFilter === 'all'} onPress={() => setReadFilter('all')} />
              <FilterChip label="Unread" active={readFilter === 'unread'} onPress={() => setReadFilter('unread')} />
              <FilterChip label="Read" active={readFilter === 'read'} onPress={() => setReadFilter('read')} />
            </View>
          </ScrollView>

          {loading ? (
            <View style={as.loadingBox}>
              <ActivityIndicator size="large" color={Colors.indigo600} />
            </View>
          ) : error ? (
            <View style={as.emptyBox}>
              <Ionicons name="alert-circle-outline" size={48} color={Colors.red} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.foreground, marginTop: 12 }}>Unable to load</Text>
              <Text style={{ fontSize: 13, color: Colors.gray500, marginTop: 4, textAlign: 'center' }}>{error}</Text>
              <TouchableOpacity style={as.retryBtn} onPress={() => loadNotifications()}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.white }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : visibleNotifications.length === 0 ? (
            <View style={as.emptyBox}>
              <Ionicons name="checkmark-circle" size={48} color="#16a34a" />
              <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.foreground, marginTop: 12 }}>All clear</Text>
              <Text style={{ fontSize: 13, color: Colors.gray500, marginTop: 4, textAlign: 'center' }}>
                No notifications match your filters.
              </Text>
            </View>
          ) : (
            visibleNotifications.map((notification) => {
              const severityColor = SEV_COLORS[notification.severity];
              const severityBg = SEV_BG[notification.severity];
              const typeLabel = ALERT_LABELS[notification.alert_type] ?? notification.alert_type;

              return (
                <TouchableOpacity
                  key={notification.id}
                  style={[as.card, Shadow.sm, !notification.is_read && as.cardUnread]}
                  activeOpacity={0.8}
                  onPress={() => setSelected(notification)}
                >
                  <View style={[as.leftBar, { backgroundColor: severityColor }]} />
                  <View style={[as.iconWrap, { backgroundColor: severityBg }]}>
                    <Ionicons name={severityIcon(notification.severity)} size={18} color={severityColor} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={as.cardTopRow}>
                      <View style={[as.typeBadge, { backgroundColor: notification.is_read ? Colors.gray100 : Colors.blue50 }]}>
                        <Text style={[as.typeBadgeTxt, { color: notification.is_read ? Colors.gray600 : Colors.blue600 }]}>{typeLabel}</Text>
                      </View>
                      {!notification.is_read ? <View style={as.unreadDot} /> : null}
                    </View>

                    <Text style={as.cardTitle} numberOfLines={2}>{notification.title}</Text>
                    <Text style={as.cardMsg} numberOfLines={2}>{notification.message}</Text>

                    <View style={as.cardMetaRow}>
                      <Text style={as.cardMeta}>{formatDate(notification.created_at)}</Text>
                      <Text style={as.cardMeta}>•</Text>
                      <Text style={as.cardMeta}>{notification.is_read ? 'Read' : 'Unread'}</Text>
                    </View>
                  </View>

                  <View style={as.cardActions}>
                    {notification.is_read ? null : (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation?.();
                          markRead(notification.id);
                        }}
                        style={as.inlineAction}
                      >
                        <Ionicons name="checkmark" size={12} color={Colors.green} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation?.();
                        Alert.alert('Delete notification', 'This notification will be removed permanently.', [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => deleteNotification(notification.id) },
                        ]);
                      }}
                      style={as.inlineAction}
                    >
                      <Ionicons name="trash-outline" size={12} color={Colors.red} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const dm = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 20, paddingTop: 24, borderBottomWidth: 1, borderBottomColor: Colors.gray100, backgroundColor: Colors.white },
  sevIcon: { width: 44, height: 44, borderRadius: BorderRadius.xl, alignItems: 'center', justifyContent: 'center' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full, marginBottom: 6 },
  badgeTxt: { fontSize: 10, fontWeight: '800', color: '#fff' },
  title: { fontSize: 15, fontWeight: '700', color: Colors.foreground, lineHeight: 22 },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaTxt: { fontSize: 12, color: Colors.gray500 },
  message: { marginTop: 12, fontSize: 14, lineHeight: 21, color: Colors.foreground, fontWeight: '600' },
  detailBox: { marginTop: 14, padding: 12, borderRadius: BorderRadius.lg, backgroundColor: Colors.gray50, borderWidth: 1, borderColor: Colors.gray100 },
  detailTitle: { fontSize: 12, fontWeight: '800', color: Colors.gray700, marginBottom: 6 },
  detailText: { fontSize: 12, color: Colors.gray600, lineHeight: 18 },
  metaGrid: { gap: 10 },
  metaRowEntry: { gap: 4 },
  metaKey: { fontSize: 11, fontWeight: '700', color: Colors.gray700 },
  metaValue: { fontSize: 12, color: Colors.gray600, lineHeight: 18 },
  nestedBox: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray100, borderRadius: BorderRadius.md, padding: 8, gap: 8 },
  nestedItem: { gap: 4 },
  nestedTitle: { fontSize: 11, fontWeight: '700', color: Colors.gray600 },
  arrayWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  arrayChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full, backgroundColor: Colors.blue50, borderWidth: 1, borderColor: Colors.blue100 },
  arrayChipTxt: { fontSize: 11, fontWeight: '600', color: Colors.blue600 },
  footer: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: Colors.gray100, backgroundColor: Colors.white, alignItems: 'center' },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: BorderRadius.lg, backgroundColor: Colors.gray100, alignItems: 'center' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, paddingHorizontal: 14, borderRadius: BorderRadius.lg },
  actionBtnTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
  deleteBtn: { width: 44, height: 44, borderRadius: BorderRadius.lg, backgroundColor: Colors.redBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.red100 },
});

const as = StyleSheet.create({
  hero: { marginBottom: 4 },
  heroTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.foreground },
  sub: { fontSize: 13, color: Colors.gray500, marginTop: 4, marginBottom: 2 },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: BorderRadius.full },
  markAllTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },
  summaryRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  summaryCard: { flex: 1, borderRadius: BorderRadius.xl, padding: 12, alignItems: 'center', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray100 },
  summaryIcon: { width: 36, height: 36, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  summaryCount: { fontSize: 20, fontWeight: '800' },
  summaryLabel: { fontSize: 10, color: Colors.gray500, fontWeight: '600' },
  chipActive: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.full },
  chipActiveTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },
  chipInactive: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.full, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray200 },
  chipInactiveTxt: { fontSize: 12, color: Colors.gray600 },
  loadingBox: { alignItems: 'center', paddingVertical: 40 },
  emptyBox: { alignItems: 'center', paddingVertical: 44, paddingHorizontal: 20 },
  retryBtn: { marginTop: 16, paddingHorizontal: 18, paddingVertical: 10, borderRadius: BorderRadius.full, backgroundColor: Colors.indigo600 },
  card: { flexDirection: 'row', alignItems: 'stretch', gap: 12, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, marginBottom: 10, borderWidth: 1, borderColor: Colors.gray100, overflow: 'hidden', paddingRight: 12 },
  cardUnread: { borderColor: Colors.blue100, backgroundColor: Colors.blue50 },
  leftBar: { width: 4, alignSelf: 'stretch' },
  iconWrap: { width: 38, height: 38, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', marginVertical: 14 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 12 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  typeBadgeTxt: { fontSize: 10, fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.blue },
  cardTitle: { fontSize: 14, fontWeight: '800', color: Colors.foreground, marginTop: 6 },
  cardMsg: { fontSize: 12.5, color: Colors.gray600, marginTop: 4, lineHeight: 18 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  cardMeta: { fontSize: 10.5, color: Colors.gray400 },
  cardActions: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10 },
  inlineAction: { width: 28, height: 28, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.gray100 },
});