import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { kpis, alerts, salesByMonth } from '../../lib/mockData';

const { width } = Dimensions.get('window');
const CARD_W = (width - Spacing.base * 2 - 12) / 2;

const fmt = (n: number) => n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n}`;

function Sparkline({ color = Colors.indigo600 }: { color?: string }) {
  const pts = [30,42,35,55,40,60,45,65,50,70,55,72];
  const H = 30; const W = CARD_W - 40;
  const max = Math.max(...pts); const min = Math.min(...pts);
  const px = (i: number) => (i / (pts.length-1)) * W;
  const py = (v: number) => H - ((v-min)/(max-min+1)) * H;
  return (
    <View style={{ height: H, overflow: 'hidden', marginTop: 8 }}>
      {pts.map((v,i) => {
        if (i===0) return null;
        const x1=px(i-1),y1=py(pts[i-1]),x2=px(i),y2=py(v);
        const len=Math.sqrt((x2-x1)**2+(y2-y1)**2);
        const angle=Math.atan2(y2-y1,x2-x1)*180/Math.PI;
        return <View key={i} style={{position:'absolute',left:x1,top:y1,width:len,height:2,backgroundColor:color,transform:[{rotate:`${angle}deg`}],transformOrigin:'0 50%'}}/>;
      })}
    </View>
  );
}

function KPICard({title,value,trend,icon,isPositive,color}:any) {
  const tc = isPositive?'#16a34a':'#dc2626';
  return (
    <View style={[st.kpiCard, Shadow.sm]}>
      <View style={st.kpiTop}>
        <View style={[st.kpiIcon,{backgroundColor:color+'20'}]}>
          <Ionicons name={icon} size={18} color={color}/>
        </View>
        <Text style={[st.kpiTrend,{color:tc}]}>{isPositive?'↑':'↓'} {trend}%</Text>
      </View>
      <Text style={st.kpiLabel}>{title}</Text>
      <Text style={st.kpiValue}>{value}</Text>
      <Sparkline color={color}/>
    </View>
  );
}

export function DashboardScreen({navigation}:any) {
  const pendingAlerts = alerts.filter(a=>a.status==='pending');
  const criticalAlerts = alerts.filter(a=>a.severity==='critical'&&a.status==='pending');
  const riskLevel = criticalAlerts.length > 1 ? 'HIGH' : criticalAlerts.length===1 ? 'MEDIUM' : 'LOW';
  const riskColor = criticalAlerts.length > 1 ? '#dc2626' : criticalAlerts.length===1 ? '#f59e0b' : '#16a34a';

  return (
    <ScrollView style={st.container} showsVerticalScrollIndicator={false}>
      <View style={st.content}>

        {/* Header */}
        <LinearGradient colors={[Colors.indigo600,Colors.violet600]} style={st.headerGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
          <View>
            <Text style={st.headerTitle}>Dashboard</Text>
            <Text style={st.headerSub}>Business overview</Text>
          </View>
          <View style={[st.riskBadge,{backgroundColor:'rgba(255,255,255,0.2)'}]}>
            <View style={[st.riskDot,{backgroundColor:riskColor}]}/>
            <Text style={st.riskTxt}>Risk: {riskLevel}</Text>
          </View>
        </LinearGradient>

        {/* KPI Grid */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>Key Metrics</Text>
          <View style={st.kpiGrid}>
            <KPICard title="Total Sales" value={fmt(kpis.totalSales)} trend={8.3} isPositive icon="trending-up-outline" color={Colors.indigo600}/>
            <KPICard title="Stock Value" value={fmt(kpis.stockValue)} trend={3.2} isPositive={false} icon="cube-outline" color="#f59e0b"/>
            <KPICard title="Receivables" value={fmt(kpis.totalReceivables)} trend={5.7} isPositive={false} icon="wallet-outline" color="#dc2626"/>
            <KPICard title="Invoices" value={kpis.totalInvoices.toString()} trend={12.5} isPositive icon="cart-outline" color="#16a34a"/>
          </View>
        </View>

        {/* Global Risk Indicator */}
        <View style={[st.riskCard, Shadow.sm]}>
          <View style={st.riskHeader}>
            <Ionicons name="shield-outline" size={20} color={riskColor}/>
            <Text style={st.riskCardTitle}>Global Risk Level</Text>
          </View>
          <View style={st.riskBar}>
            <LinearGradient colors={['#16a34a','#f59e0b','#dc2626']} style={st.riskBarGrad} start={{x:0,y:0}} end={{x:1,y:0}}/>
            <View style={[st.riskIndicator,{left:`${Math.min(90,(criticalAlerts.length/alerts.length)*100+20)}%` as any}]}/>
          </View>
          <View style={st.riskLevels}>
            <Text style={{fontSize:10,color:'#16a34a'}}>Low</Text>
            <Text style={{fontSize:10,color:'#f59e0b'}}>Medium</Text>
            <Text style={{fontSize:10,color:'#dc2626'}}>High</Text>
          </View>
        </View>

        {/* Recent Alerts */}
        <View style={st.section}>
          <View style={st.sectionHdr}>
            <Text style={st.sectionTitle}>Recent Alerts</Text>
            <TouchableOpacity onPress={()=>navigation.navigate('Alerts')}>
              <Text style={st.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          {pendingAlerts.slice(0,3).map(alert=>(
            <TouchableOpacity key={alert.id} style={[st.alertCard, Shadow.sm]} onPress={()=>navigation.navigate('Alerts')}>
              <View style={[st.alertSeverity,{backgroundColor:alert.severity==='critical'?'#fee2e2':alert.severity==='medium'?'#fef3c7':'#dcfce7'}]}>
                <Ionicons name={alert.severity==='critical'?'warning':'alert-circle-outline'} size={18} color={alert.severity==='critical'?'#dc2626':alert.severity==='medium'?'#f59e0b':'#16a34a'}/>
              </View>
              <View style={{flex:1}}>
                <Text style={st.alertMsg} numberOfLines={2}>{alert.message}</Text>
                <Text style={st.alertDate}>{alert.daysActive} days active</Text>
              </View>
              <View style={[st.severityBadge,{backgroundColor:alert.severity==='critical'?'#dc2626':alert.severity==='medium'?'#f59e0b':'#16a34a'}]}>
                <Text style={st.severityTxt}>{alert.severity}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container:{flex:1,backgroundColor:Colors.gray50},
  content:{paddingBottom:32},
  headerGrad:{padding:20,paddingTop:28,paddingBottom:28,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  headerTitle:{fontSize:24,fontWeight:'800',color:'#fff'},
  headerSub:{fontSize:13,color:'rgba(255,255,255,0.75)',marginTop:2},
  riskBadge:{flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:12,paddingVertical:6,borderRadius:BorderRadius.full},
  riskDot:{width:8,height:8,borderRadius:4},
  riskTxt:{fontSize:12,fontWeight:'700',color:'#fff'},
  section:{padding:Spacing.base,paddingBottom:0},
  sectionHdr:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12},
  sectionTitle:{fontSize:17,fontWeight:'800',color:Colors.foreground,marginBottom:12},
  seeAll:{fontSize:13,color:Colors.indigo600,fontWeight:'600'},
  kpiGrid:{flexDirection:'row',flexWrap:'wrap',gap:12},
  kpiCard:{width:CARD_W,backgroundColor:Colors.white,borderRadius:BorderRadius.xl,padding:14,borderWidth:1,borderColor:Colors.gray100},
  kpiTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:10},
  kpiIcon:{width:36,height:36,borderRadius:BorderRadius.lg,alignItems:'center',justifyContent:'center'},
  kpiTrend:{fontSize:12,fontWeight:'700'},
  kpiLabel:{fontSize:11,color:Colors.gray500,marginBottom:2},
  kpiValue:{fontSize:17,fontWeight:'800',color:Colors.foreground},
  riskCard:{backgroundColor:Colors.white,borderRadius:BorderRadius.xl,padding:16,margin:Spacing.base,borderWidth:1,borderColor:Colors.gray100},
  riskHeader:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:12},
  riskCardTitle:{fontSize:15,fontWeight:'700',color:Colors.foreground},
  riskBar:{height:8,borderRadius:4,overflow:'hidden',position:'relative'},
  riskBarGrad:{height:8,borderRadius:4},
  riskIndicator:{position:'absolute',top:-3,width:14,height:14,borderRadius:7,backgroundColor:'#fff',borderWidth:2,borderColor:Colors.foreground},
  riskLevels:{flexDirection:'row',justifyContent:'space-between',marginTop:6},
  alertCard:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:Colors.white,borderRadius:BorderRadius.xl,padding:14,marginBottom:10,borderWidth:1,borderColor:Colors.gray100},
  alertSeverity:{width:36,height:36,borderRadius:BorderRadius.lg,alignItems:'center',justifyContent:'center'},
  alertMsg:{fontSize:13,fontWeight:'600',color:Colors.foreground},
  alertDate:{fontSize:11,color:Colors.gray500,marginTop:2},
  severityBadge:{paddingHorizontal:8,paddingVertical:3,borderRadius:BorderRadius.full},
  severityTxt:{fontSize:9,fontWeight:'700',color:'#fff',textTransform:'uppercase'},
});
