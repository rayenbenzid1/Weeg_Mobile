import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { agingReceivables, products, branches, recentTransactions } from '../../lib/mockData';

type Tab = 'aging'|'inventory'|'transactions';

const fmt = (n:number) => n>=1000?`$${(n/1000).toFixed(0)}K`:`$${n}`;

// ── Aging Tab ─────────────────────────────────────────────────────────────────
function AgingTab() {
  const riskyCustomers = [
    {name:'Tech Solutions Inc.',amount:18590,days:0,score:85,overdue:31},
    {name:'Global Trading',amount:7992,days:22,score:72,overdue:56},
    {name:'Office Supplies Co.',amount:19298,days:52,score:65,overdue:52},
    {name:'Smart Business Inc.',amount:7243,days:43,score:55,overdue:43},
    {name:'Digital Services LLC',amount:15735,days:56,score:45,overdue:56},
  ];

  const sendReminder = (name:string) => Alert.alert('Reminder Sent',`Payment reminder sent to ${name}`);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={{padding:Spacing.base}}>
        {/* Aging Summary */}
        <View style={[ct.card,Shadow.sm,{marginBottom:16}]}>
          <Text style={ct.cardTitle}>Aging Summary</Text>
          <Text style={ct.cardSub}>Receivables breakdown by period</Text>
          {[
            {label:'0-30 days',amount:88200,color:'#22c55e',pct:45},
            {label:'31-60 days',amount:58800,color:'#f59e0b',pct:30},
            {label:'61-90 days',amount:29400,color:'#f97316',pct:15},
            {label:'90+ days',amount:19600,color:'#dc2626',pct:10},
          ].map((row,i)=>(
            <View key={i} style={ct.agingRow}>
              <View style={[ct.agingDot,{backgroundColor:row.color}]}/>
              <Text style={{flex:1,fontSize:13,color:Colors.foreground}}>{row.label}</Text>
              <Text style={{fontSize:13,fontWeight:'700',color:Colors.foreground,marginRight:12}}>{fmt(row.amount)}</Text>
              <View style={{width:80,height:6,borderRadius:3,backgroundColor:Colors.gray100,overflow:'hidden'}}>
                <View style={{width:`${row.pct}%` as any,height:6,borderRadius:3,backgroundColor:row.color}}/>
              </View>
            </View>
          ))}
        </View>

        {/* Top Risky Customers */}
        <Text style={ct.sectionTitle}>Top 5 Risky Customers</Text>
        {riskyCustomers.map((c,i)=>(
          <View key={i} style={[ct.riskCard,Shadow.sm]}>
            <View style={ct.riskTop}>
              <View>
                <Text style={ct.riskName}>{c.name}</Text>
                <View style={{flexDirection:'row',alignItems:'center',gap:8,marginTop:2}}>
                  <Text style={{fontSize:12,color:Colors.gray500}}>{fmt(c.amount)}</Text>
                  <View style={[ct.daysBadge,{backgroundColor:c.overdue>30?'#dc2626':Colors.indigo600}]}>
                    <Text style={ct.daysBadgeTxt}>{c.overdue} days</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={ct.reminderBtn} onPress={()=>sendReminder(c.name)}>
                <Ionicons name="send-outline" size={14} color={Colors.indigo600}/>
                <Text style={ct.reminderTxt}>Remind</Text>
              </TouchableOpacity>
            </View>
            {/* Score bar */}
            <View style={{marginTop:10}}>
              <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:4}}>
                <Text style={{fontSize:11,color:Colors.gray500}}>Risk Score</Text>
                <Text style={{fontSize:11,fontWeight:'700',color:Colors.foreground}}>{c.score}/100</Text>
              </View>
              <View style={{height:6,borderRadius:3,backgroundColor:Colors.gray100,overflow:'hidden'}}>
                <LinearGradient colors={c.score>70?['#dc2626','#ef4444']:c.score>50?['#f59e0b','#fbbf24']:['#16a34a','#22c55e']} style={{width:`${c.score}%` as any,height:6,borderRadius:3}} start={{x:0,y:0}} end={{x:1,y:0}}/>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ── Inventory Tab ─────────────────────────────────────────────────────────────
function InventoryTab() {
  const critical = products.filter(p=>p.currentStock<=p.minStock);
  const all = products.map(p=>({
    ...p,
    stockPct:(p.currentStock/p.maxStock)*100,
    status:p.currentStock<=p.minStock?'critical':p.currentStock<=p.minStock*1.5?'low':'ok',
  }));

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={{padding:Spacing.base}}>
        {/* Critical Banner */}
        {critical.length>0&&(
          <View style={[ct.criticalBanner,{marginBottom:16}]}>
            <LinearGradient colors={['#fee2e2','#fff']} style={{flexDirection:'row',alignItems:'center',gap:12,padding:14,borderRadius:BorderRadius.xl}} start={{x:0,y:0}} end={{x:1,y:0}}>
              <View style={{width:36,height:36,borderRadius:BorderRadius.lg,backgroundColor:'#fee2e2',alignItems:'center',justifyContent:'center'}}>
                <Ionicons name="warning" size={18} color="#dc2626"/>
              </View>
              <View style={{flex:1}}>
                <Text style={{fontSize:14,fontWeight:'700',color:'#dc2626'}}>{critical.length} Critical Stock Alert{critical.length>1?'s':''}</Text>
                <Text style={{fontSize:12,color:Colors.gray500}}>{critical[0].name} below minimum</Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Branch Quick Stats */}
        <View style={[ct.card,Shadow.sm,{marginBottom:16}]}>
          <Text style={ct.cardTitle}>Stock by Branch</Text>
          <Text style={ct.cardSub}>Quick overview across locations</Text>
          {branches.map((b,i)=>{
            const pct=[65,82,45,70][i];
            return(
              <View key={b.id} style={{marginBottom:12}}>
                <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:4}}>
                  <Text style={{fontSize:13,fontWeight:'600',color:Colors.foreground}}>{b.name}</Text>
                  <Text style={{fontSize:12,color:Colors.gray500}}>{pct}%</Text>
                </View>
                <View style={{height:8,borderRadius:4,backgroundColor:Colors.gray100,overflow:'hidden'}}>
                  <LinearGradient colors={pct<50?['#dc2626','#ef4444']:pct<70?['#f59e0b','#fbbf24']:[Colors.indigo600,Colors.violet600]} style={{width:`${pct}%` as any,height:8,borderRadius:4}} start={{x:0,y:0}} end={{x:1,y:0}}/>
                </View>
              </View>
            );
          })}
        </View>

        {/* Product List */}
        <Text style={ct.sectionTitle}>All Products</Text>
        {all.map((p,i)=>(
          <View key={p.id} style={[ct.productCard,Shadow.sm]}>
            <View style={[ct.stockStatus,{backgroundColor:p.status==='critical'?'#fee2e2':p.status==='low'?'#fef3c7':'#dcfce7'}]}>
              <Ionicons name={p.status==='critical'?'warning':p.status==='low'?'alert-circle-outline':'checkmark-circle-outline'} size={16} color={p.status==='critical'?'#dc2626':p.status==='low'?'#f59e0b':'#16a34a'}/>
            </View>
            <View style={{flex:1}}>
              <Text style={ct.productName}>{p.name}</Text>
              <Text style={{fontSize:11,color:Colors.gray500}}>{p.sku} · {p.category}</Text>
              <View style={{marginTop:8}}>
                <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:3}}>
                  <Text style={{fontSize:10,color:Colors.gray500}}>Stock: {p.currentStock} / {p.maxStock}</Text>
                  <Text style={{fontSize:10,color:Colors.gray500}}>Min: {p.minStock}</Text>
                </View>
                <View style={{height:5,borderRadius:3,backgroundColor:Colors.gray100,overflow:'hidden'}}>
                  <View style={{width:`${p.stockPct}%` as any,height:5,borderRadius:3,backgroundColor:p.status==='critical'?'#dc2626':p.status==='low'?'#f59e0b':Colors.indigo600}}/>
                </View>
              </View>
            </View>
            <View style={{alignItems:'flex-end'}}>
              <Text style={{fontSize:13,fontWeight:'700',color:Colors.foreground}}>${p.salePrice}</Text>
              <View style={[ct.stockBadge,{backgroundColor:p.status==='critical'?'#dc2626':p.status==='low'?'#f59e0b':'#16a34a'}]}>
                <Text style={{fontSize:9,fontWeight:'800',color:'#fff'}}>{p.status.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ── Transactions Tab ──────────────────────────────────────────────────────────
function TransactionsTab() {
  const [search, setSearch] = useState('');
  const fmt2 = (n:number) => `$${n.toLocaleString()}`;

  const filtered = recentTransactions.filter(tx=>
    tx.product.toLowerCase().includes(search.toLowerCase())||
    tx.invoiceNumber.toLowerCase().includes(search.toLowerCase())||
    (tx.customer||'').toLowerCase().includes(search.toLowerCase())
  );

  const totalSales = recentTransactions.filter(t=>t.type==='sale').reduce((s,t)=>s+t.total,0);
  const totalPurchases = recentTransactions.filter(t=>t.type==='purchase').reduce((s,t)=>s+t.total,0);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={{padding:Spacing.base}}>
        {/* Totals */}
        <View style={{flexDirection:'row',gap:12,marginBottom:16}}>
          <View style={[ct.totalCard,{borderLeftColor:Colors.indigo600},Shadow.sm]}>
            <Text style={{fontSize:11,color:Colors.gray500}}>Sales</Text>
            <Text style={{fontSize:16,fontWeight:'800',color:Colors.indigo600}}>{fmt2(totalSales)}</Text>
          </View>
          <View style={[ct.totalCard,{borderLeftColor:'#f59e0b'},Shadow.sm]}>
            <Text style={{fontSize:11,color:Colors.gray500}}>Purchases</Text>
            <Text style={{fontSize:16,fontWeight:'800',color:'#f59e0b'}}>{fmt2(totalPurchases)}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={ct.searchBar}>
          <Ionicons name="search-outline" size={16} color={Colors.gray400}/>
          <TextInput value={search} onChangeText={setSearch} placeholder="Search by invoice, product, customer..." placeholderTextColor={Colors.gray400} style={{flex:1,fontSize:13,color:Colors.foreground}}/>
          {search.length>0&&<TouchableOpacity onPress={()=>setSearch('')}><Ionicons name="close-circle" size={16} color={Colors.gray400}/></TouchableOpacity>}
        </View>

        {/* Transactions */}
        {filtered.map(tx=>(
          <View key={tx.id} style={[ct.txCard,Shadow.sm]}>
            <View style={[ct.txType,{backgroundColor:tx.type==='sale'?Colors.indigo100:Colors.gray100}]}>
              <Ionicons name={tx.type==='sale'?'arrow-up':'arrow-down'} size={14} color={tx.type==='sale'?Colors.indigo600:Colors.gray600}/>
            </View>
            <View style={{flex:1}}>
              <Text style={ct.txProduct} numberOfLines={1}>{tx.product}</Text>
              <Text style={{fontSize:11,color:Colors.gray500}}>{tx.invoiceNumber}</Text>
              <Text style={{fontSize:11,color:Colors.gray400,marginTop:2}}>{tx.branch} · {new Date(tx.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</Text>
            </View>
            <View style={{alignItems:'flex-end'}}>
              <Text style={[ct.txTotal,{color:tx.type==='sale'?'#16a34a':Colors.foreground}]}>
                {tx.type==='sale'?'+':'-'}{fmt2(tx.total)}
              </Text>
              <Text style={{fontSize:11,color:Colors.gray500}}>Qty: {tx.quantity}</Text>
            </View>
          </View>
        ))}
        {filtered.length===0&&(
          <View style={{alignItems:'center',paddingVertical:32}}>
            <Ionicons name="search-outline" size={40} color={Colors.gray300}/>
            <Text style={{fontSize:14,color:Colors.gray500,marginTop:8}}>No results found</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function ControlScreen() {
  const [tab, setTab] = useState<Tab>('aging');

  const tabs: {id:Tab,label:string,icon:string}[] = [
    {id:'aging',label:'Aging',icon:'people-outline'},
    {id:'inventory',label:'Inventory',icon:'cube-outline'},
    {id:'transactions',label:'Transactions',icon:'receipt-outline'},
  ];

  return (
    <View style={{flex:1,backgroundColor:Colors.gray50}}>
      {/* Header */}
      <View style={ct.pageHeader}>
        <Text style={ct.pageTitle}>Control Center</Text>
        <Text style={ct.pageSub}>Real-time business monitoring</Text>
      </View>

      {/* Tab Bar */}
      <View style={ct.tabBar}>
        {tabs.map(t=>(
          <TouchableOpacity key={t.id} style={[ct.tabBtn,tab===t.id&&ct.tabBtnActive]} onPress={()=>setTab(t.id)}>
            <Ionicons name={t.icon as any} size={16} color={tab===t.id?Colors.indigo600:Colors.gray500}/>
            <Text style={[ct.tabLabel,tab===t.id&&{color:Colors.indigo600,fontWeight:'700'}]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab==='aging'&&<AgingTab/>}
      {tab==='inventory'&&<InventoryTab/>}
      {tab==='transactions'&&<TransactionsTab/>}
    </View>
  );
}

const ct = StyleSheet.create({
  pageHeader:{padding:Spacing.base,paddingBottom:12,backgroundColor:Colors.white,borderBottomWidth:1,borderBottomColor:Colors.gray100},
  pageTitle:{fontSize:24,fontWeight:'800',color:Colors.foreground},
  pageSub:{fontSize:13,color:Colors.gray500,marginTop:2},
  tabBar:{flexDirection:'row',backgroundColor:Colors.white,borderBottomWidth:1,borderBottomColor:Colors.gray100,paddingHorizontal:Spacing.base},
  tabBtn:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,paddingVertical:12,borderBottomWidth:2,borderBottomColor:'transparent'},
  tabBtnActive:{borderBottomColor:Colors.indigo600},
  tabLabel:{fontSize:12,fontWeight:'500',color:Colors.gray500},
  card:{backgroundColor:Colors.white,borderRadius:BorderRadius.xl,padding:16,borderWidth:1,borderColor:Colors.gray100},
  cardTitle:{fontSize:15,fontWeight:'700',color:Colors.foreground,marginBottom:2},
  cardSub:{fontSize:12,color:Colors.gray500,marginBottom:14},
  sectionTitle:{fontSize:17,fontWeight:'800',color:Colors.foreground,marginBottom:12},
  agingRow:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:12},
  agingDot:{width:10,height:10,borderRadius:5},
  riskCard:{backgroundColor:Colors.white,borderRadius:BorderRadius.xl,padding:14,marginBottom:10,borderWidth:1,borderColor:Colors.gray100},
  riskTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},
  riskName:{fontSize:14,fontWeight:'700',color:Colors.foreground},
  daysBadge:{paddingHorizontal:8,paddingVertical:3,borderRadius:BorderRadius.full},
  daysBadgeTxt:{fontSize:10,fontWeight:'700',color:'#fff'},
  reminderBtn:{flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:12,paddingVertical:7,borderRadius:BorderRadius.lg,backgroundColor:Colors.indigo50,borderWidth:1,borderColor:Colors.indigo100},
  reminderTxt:{fontSize:12,color:Colors.indigo600,fontWeight:'600'},
  criticalBanner:{borderRadius:BorderRadius.xl,overflow:'hidden',borderWidth:1,borderColor:'#fecaca'},
  productCard:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:Colors.white,borderRadius:BorderRadius.xl,padding:14,marginBottom:10,borderWidth:1,borderColor:Colors.gray100},
  stockStatus:{width:34,height:34,borderRadius:BorderRadius.lg,alignItems:'center',justifyContent:'center'},
  productName:{fontSize:13,fontWeight:'700',color:Colors.foreground},
  stockBadge:{paddingHorizontal:6,paddingVertical:2,borderRadius:BorderRadius.full,marginTop:4},
  totalCard:{flex:1,backgroundColor:Colors.white,borderRadius:BorderRadius.xl,padding:14,borderWidth:1,borderColor:Colors.gray100,borderLeftWidth:4},
  searchBar:{flexDirection:'row',alignItems:'center',gap:10,backgroundColor:Colors.white,borderRadius:BorderRadius.xl,paddingHorizontal:14,paddingVertical:10,marginBottom:12,borderWidth:1,borderColor:Colors.gray100},
  txCard:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:Colors.white,borderRadius:BorderRadius.xl,padding:14,marginBottom:10,borderWidth:1,borderColor:Colors.gray100},
  txType:{width:32,height:32,borderRadius:BorderRadius.lg,alignItems:'center',justifyContent:'center'},
  txProduct:{fontSize:13,fontWeight:'600',color:Colors.foreground},
  txTotal:{fontSize:14,fontWeight:'700'},
});
