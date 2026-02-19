import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { alerts } from '../../lib/mockData';

type Severity = 'all'|'critical'|'medium'|'low';

const SEV_COLORS: Record<string, string> = {
  critical: '#dc2626', medium: '#f59e0b', low: '#16a34a',
};
const SEV_BG: Record<string, string> = {
  critical: '#fee2e2', medium: '#fef3c7', low: '#dcfce7',
};

function AlertDetailModal({alert, onClose, onResolve}: any) {
  const [showAI, setShowAI] = useState(false);
  if (!alert) return null;
  const color = SEV_COLORS[alert.severity];
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{flex:1,backgroundColor:Colors.white}}>
        {/* Header */}
        <View style={dm.header}>
          <View style={[dm.sevIcon,{backgroundColor:SEV_BG[alert.severity]}]}>
            <Ionicons name="warning" size={22} color={color}/>
          </View>
          <View style={{flex:1}}>
            <View style={[dm.badge,{backgroundColor:color}]}>
              <Text style={dm.badgeTxt}>{alert.severity.toUpperCase()}</Text>
            </View>
            <Text style={dm.title}>{alert.message}</Text>
          </View>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={Colors.gray500}/></TouchableOpacity>
        </View>

        <ScrollView style={{flex:1}} contentContainerStyle={{padding:20}}>
          {/* Meta */}
          <View style={dm.metaRow}>
            <View style={dm.metaItem}><Ionicons name="calendar-outline" size={14} color={Colors.gray500}/><Text style={dm.metaTxt}>Date: {alert.date}</Text></View>
            <View style={dm.metaItem}><Ionicons name="time-outline" size={14} color={Colors.gray500}/><Text style={dm.metaTxt}>{alert.daysActive} days active</Text></View>
          </View>
          <View style={dm.metaRow}>
            <View style={dm.metaItem}><Ionicons name="pricetag-outline" size={14} color={Colors.gray500}/><Text style={dm.metaTxt}>Type: {alert.type.replace(/_/g,' ')}</Text></View>
            <View style={[dm.statusBadge,{backgroundColor:alert.status==='pending'?'#fef3c7':'#dcfce7'}]}>
              <Text style={{fontSize:11,fontWeight:'700',color:alert.status==='pending'?'#f59e0b':'#16a34a'}}>{alert.status.toUpperCase()}</Text>
            </View>
          </View>

          {/* AI Explanation */}
          <TouchableOpacity style={dm.aiBtn} onPress={()=>setShowAI(!showAI)}>
            <LinearGradient colors={[Colors.indigo600,Colors.violet600]} style={dm.aiBtnGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
              <Ionicons name="sparkles" size={16} color="#fff"/>
              <Text style={dm.aiBtnTxt}>{showAI?'Hide':'Show'} AI Explanation</Text>
              <Ionicons name={showAI?'chevron-up':'chevron-down'} size={14} color="#fff"/>
            </LinearGradient>
          </TouchableOpacity>

          {showAI && alert.aiExplanation && (
            <View style={dm.aiBox}>
              <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:10}}>
                <Ionicons name="sparkles" size={16} color={Colors.indigo600}/>
                <Text style={{fontSize:14,fontWeight:'700',color:Colors.indigo600}}>AI Analysis</Text>
              </View>
              <Text style={{fontSize:13,color:Colors.foreground,lineHeight:20}}>{alert.aiExplanation}</Text>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        {alert.status === 'pending' && (
          <View style={dm.footer}>
            <TouchableOpacity style={dm.cancelBtn} onPress={onClose}>
              <Text style={{fontSize:14,fontWeight:'600',color:Colors.foreground}}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>{onResolve(alert.id);onClose();}}>
              <LinearGradient colors={['#16a34a','#15803d']} style={dm.resolveBtn} start={{x:0,y:0}} end={{x:1,y:0}}>
                <Ionicons name="checkmark-circle" size={16} color="#fff"/>
                <Text style={{fontSize:14,fontWeight:'700',color:'#fff'}}>Mark as Resolved</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const dm = StyleSheet.create({
  header:{flexDirection:'row',alignItems:'flex-start',gap:12,padding:20,paddingTop:24,borderBottomWidth:1,borderBottomColor:Colors.gray100},
  sevIcon:{width:44,height:44,borderRadius:BorderRadius.xl,alignItems:'center',justifyContent:'center'},
  badge:{alignSelf:'flex-start',paddingHorizontal:8,paddingVertical:2,borderRadius:BorderRadius.full,marginBottom:6},
  badgeTxt:{fontSize:10,fontWeight:'800',color:'#fff'},
  title:{fontSize:15,fontWeight:'700',color:Colors.foreground,lineHeight:22},
  metaRow:{flexDirection:'row',alignItems:'center',gap:16,marginBottom:10},
  metaItem:{flexDirection:'row',alignItems:'center',gap:6},
  metaTxt:{fontSize:12,color:Colors.gray500},
  statusBadge:{paddingHorizontal:10,paddingVertical:4,borderRadius:BorderRadius.full},
  aiBtn:{marginVertical:16,borderRadius:BorderRadius.lg,overflow:'hidden'},
  aiBtnGrad:{flexDirection:'row',alignItems:'center',gap:8,padding:14,justifyContent:'center'},
  aiBtnTxt:{fontSize:14,fontWeight:'700',color:'#fff',flex:1,textAlign:'center'},
  aiBox:{backgroundColor:Colors.indigo50,borderRadius:BorderRadius.xl,padding:16,borderWidth:1,borderColor:Colors.indigo100},
  footer:{flexDirection:'row',gap:12,padding:16,borderTopWidth:1,borderTopColor:Colors.gray100},
  cancelBtn:{flex:1,paddingVertical:13,borderRadius:BorderRadius.lg,backgroundColor:Colors.gray100,alignItems:'center'},
  resolveBtn:{flex:2,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingVertical:13,borderRadius:BorderRadius.lg},
});

export function AlertsScreen() {
  const [filter, setFilter] = useState<Severity>('all');
  const [statusFilter, setStatusFilter] = useState<'all'|'pending'|'resolved'>('all');
  const [selected, setSelected] = useState<any>(null);
  const [resolvedIds, setResolvedIds] = useState<string[]>([]);

  const resolve = (id: string) => {
    setResolvedIds(prev=>[...prev,id]);
    Alert.alert('✓ Resolved','Alert marked as resolved');
  };

  const enriched = alerts.map(a=>({
    ...a,
    status: resolvedIds.includes(a.id)?'resolved':a.status,
  }));

  const filtered = enriched
    .filter(a=>filter==='all'||a.severity===filter)
    .filter(a=>statusFilter==='all'||a.status===statusFilter);

  const counts = {
    critical: enriched.filter(a=>a.severity==='critical'&&a.status==='pending').length,
    medium: enriched.filter(a=>a.severity==='medium'&&a.status==='pending').length,
    low: enriched.filter(a=>a.severity==='low'&&a.status==='pending').length,
  };

  return (
    <View style={{flex:1,backgroundColor:Colors.gray50}}>
      {selected && <AlertDetailModal alert={selected} onClose={()=>setSelected(null)} onResolve={resolve}/>}

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{padding:Spacing.base,paddingBottom:32}}>
          <Text style={as.title}>Smart Alerts</Text>
          <Text style={as.sub}>Real-time critical business alerts</Text>

          {/* Summary Cards */}
          <View style={as.summaryRow}>
            {[
              {label:'Critical',count:counts.critical,color:'#dc2626',bg:'#fee2e2',icon:'warning'},
              {label:'Medium',count:counts.medium,color:'#f59e0b',bg:'#fef3c7',icon:'alert-circle-outline'},
              {label:'Low',count:counts.low,color:'#16a34a',bg:'#dcfce7',icon:'information-circle-outline'},
            ].map((item,i)=>(
              <TouchableOpacity key={i} style={[as.summaryCard,Shadow.sm,{backgroundColor:Colors.white}]} onPress={()=>setFilter(item.label.toLowerCase() as Severity)}>
                <View style={[as.summaryIcon,{backgroundColor:item.bg}]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color}/>
                </View>
                <Text style={[as.summaryCount,{color:item.color}]}>{item.count}</Text>
                <Text style={as.summaryLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Severity Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:8}}>
            <View style={{flexDirection:'row',gap:8,paddingVertical:4}}>
              {(['all','critical','medium','low'] as Severity[]).map(s=>(
                <TouchableOpacity key={s} onPress={()=>setFilter(s)}>
                  {filter===s?(
                    <LinearGradient colors={[Colors.indigo600,Colors.violet600]} style={as.pillActive} start={{x:0,y:0}} end={{x:1,y:0}}>
                      <Text style={as.pillActiveTxt}>{s==='all'?'All':s.charAt(0).toUpperCase()+s.slice(1)}</Text>
                    </LinearGradient>
                  ):(
                    <View style={as.pillInactive}><Text style={as.pillInactiveTxt}>{s==='all'?'All':s.charAt(0).toUpperCase()+s.slice(1)}</Text></View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Status Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:16}}>
            <View style={{flexDirection:'row',gap:8,paddingVertical:4}}>
              {(['all','pending','resolved'] as const).map(s=>(
                <TouchableOpacity key={s} style={[as.statusPill,statusFilter===s&&as.statusPillActive]} onPress={()=>setStatusFilter(s)}>
                  <Text style={[as.statusPillTxt,statusFilter===s&&{color:Colors.indigo600,fontWeight:'700'}]}>
                    {s.charAt(0).toUpperCase()+s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Alert List */}
          {filtered.length===0?(
            <View style={as.emptyBox}>
              <Ionicons name="checkmark-circle" size={48} color="#16a34a"/>
              <Text style={{fontSize:16,fontWeight:'700',color:Colors.foreground,marginTop:12}}>All clear!</Text>
              <Text style={{fontSize:13,color:Colors.gray500,marginTop:4}}>No alerts match your filter</Text>
            </View>
          ):filtered.map(alert=>(
            <TouchableOpacity key={alert.id} style={[as.alertCard,Shadow.sm]} onPress={()=>setSelected(alert)}>
              <View style={[as.leftBar,{backgroundColor:SEV_COLORS[alert.severity]}]}/>
              <View style={[as.alertIcon,{backgroundColor:SEV_BG[alert.severity]}]}>
                <Ionicons name="warning-outline" size={18} color={SEV_COLORS[alert.severity]}/>
              </View>
              <View style={{flex:1}}>
                <Text style={as.alertMsg} numberOfLines={2}>{alert.message}</Text>
                <View style={{flexDirection:'row',alignItems:'center',gap:8,marginTop:4}}>
                  <Text style={as.alertMeta}>{alert.daysActive}d active</Text>
                  <View style={[as.statusDot,{backgroundColor:alert.status==='pending'?'#f59e0b':'#16a34a'}]}/>
                  <Text style={{fontSize:10,color:Colors.gray400}}>{alert.status}</Text>
                </View>
              </View>
              <View style={{alignItems:'flex-end',gap:6}}>
                <View style={[as.sevBadge,{backgroundColor:SEV_COLORS[alert.severity]}]}>
                  <Text style={as.sevBadgeTxt}>{alert.severity}</Text>
                </View>
                {alert.status==='pending'&&(
                  <TouchableOpacity onPress={(e)=>{e.stopPropagation?.();resolve(alert.id);}}>
                    <View style={as.resolveBtn}>
                      <Ionicons name="checkmark" size={12} color="#16a34a"/>
                      <Text style={{fontSize:10,color:'#16a34a',fontWeight:'700'}}>Resolve</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const as = StyleSheet.create({
  title:{fontSize:26,fontWeight:'800',color:Colors.foreground},
  sub:{fontSize:13,color:Colors.gray500,marginBottom:20,marginTop:4},
  summaryRow:{flexDirection:'row',gap:10,marginBottom:16},
  summaryCard:{flex:1,borderRadius:BorderRadius.xl,padding:12,alignItems:'center',borderWidth:1,borderColor:Colors.gray100},
  summaryIcon:{width:36,height:36,borderRadius:BorderRadius.lg,alignItems:'center',justifyContent:'center',marginBottom:6},
  summaryCount:{fontSize:20,fontWeight:'800'},
  summaryLabel:{fontSize:10,color:Colors.gray500,fontWeight:'600'},
  pillActive:{paddingHorizontal:14,paddingVertical:7,borderRadius:BorderRadius.full},
  pillActiveTxt:{fontSize:12,fontWeight:'700',color:'#fff'},
  pillInactive:{paddingHorizontal:14,paddingVertical:7,borderRadius:BorderRadius.full,backgroundColor:Colors.white,borderWidth:1,borderColor:Colors.gray200},
  pillInactiveTxt:{fontSize:12,color:Colors.gray600},
  statusPill:{paddingHorizontal:14,paddingVertical:6,borderRadius:BorderRadius.full,backgroundColor:Colors.gray100,borderWidth:1,borderColor:Colors.gray200},
  statusPillActive:{backgroundColor:Colors.indigo50,borderColor:Colors.indigo600},
  statusPillTxt:{fontSize:12,color:Colors.gray600},
  alertCard:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:Colors.white,borderRadius:BorderRadius.xl,marginBottom:10,borderWidth:1,borderColor:Colors.gray100,overflow:'hidden'},
  leftBar:{width:4,alignSelf:'stretch'},
  alertIcon:{width:36,height:36,borderRadius:BorderRadius.lg,alignItems:'center',justifyContent:'center'},
  alertMsg:{fontSize:13,fontWeight:'600',color:Colors.foreground},
  alertMeta:{fontSize:10,color:Colors.gray400},
  statusDot:{width:5,height:5,borderRadius:2.5},
  sevBadge:{paddingHorizontal:7,paddingVertical:2,borderRadius:BorderRadius.full},
  sevBadgeTxt:{fontSize:9,fontWeight:'800',color:'#fff'},
  resolveBtn:{flexDirection:'row',alignItems:'center',gap:3,paddingHorizontal:6,paddingVertical:3,borderRadius:BorderRadius.full,backgroundColor:'#dcfce7',borderWidth:1,borderColor:'#16a34a'},
  emptyBox:{alignItems:'center',paddingVertical:40},
});
