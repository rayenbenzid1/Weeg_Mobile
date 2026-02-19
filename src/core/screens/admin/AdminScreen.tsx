import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';

const PERMISSIONS_GROUPS = [
  { group:'Data Management', items:[
    {id:'import_data',label:'Import Data',desc:'Import Excel files into the database'},
    {id:'export_data',label:'Export Data',desc:'Export data to Excel/CSV files'},
  ]},
  { group:'Analytics & Reports', items:[
    {id:'view_dashboard',label:'View Dashboard',desc:'Access main dashboard with KPIs'},
    {id:'view_reports',label:'View Reports',desc:'Access and view all reports'},
    {id:'generate_reports',label:'Generate Reports',desc:'Create and generate custom reports'},
    {id:'view_kpis',label:'View KPIs',desc:'Access KPI engine and metrics'},
    {id:'filter_dashboard',label:'Filter Dashboard',desc:'Apply filters to dashboard data'},
    {id:'ai_insights',label:'AI Insights',desc:'Access AI-powered insights and chat'},
  ]},
  { group:'Sales & Inventory', items:[
    {id:'view_sales',label:'View Sales',desc:'Access sales and purchases data'},
    {id:'view_inventory',label:'View Inventory',desc:'Check product availability and stock levels'},
    {id:'view_payments',label:'View Customer Payments',desc:'Access customer payment history'},
    {id:'view_aging',label:'View Aging Receivables',desc:'Track overdue payments and receivables'},
  ]},
  { group:'System Access', items:[
    {id:'receive_notifs',label:'Receive Notifications',desc:'Get notified about important events'},
    {id:'manage_alerts',label:'Manage Alerts',desc:'Mark alerts as resolved'},
    {id:'view_profile',label:'View Profile',desc:'Access personal profile'},
    {id:'change_password',label:'Change Password',desc:'Update account password'},
  ]},
];

const DEFAULT_PERMS = ['import_data','view_dashboard','view_reports','generate_reports','view_kpis','filter_dashboard','view_sales','view_inventory','view_payments','receive_notifs','manage_alerts','view_profile','change_password'];
const ALL_PERMS = PERMISSIONS_GROUPS.flatMap(g=>g.items.map(i=>i.id));

const PENDING_MANAGERS = [
  {id:'M1',name:'Ahmed Benzara',email:'ahmed@company.com',company:'TechCorp DZ',date:'2026-02-15',branch:'North'},
  {id:'M2',name:'Sarah Mansour',email:'sarah@business.com',company:'RetailPro',date:'2026-02-14',branch:'South'},
  {id:'M3',name:'Karim Djebbar',email:'karim@enterprise.com',company:'EnterpriseLtd',date:'2026-02-13',branch:'East'},
];

const VERIFIED_MANAGERS = [
  {id:'V1',name:'John Manager',email:'john@company.com',company:'MainCorp',branch:'Main Store',verifiedDate:'2025-12-01',agents:3},
  {id:'V2',name:'Lisa Chen',email:'lisa@corp.com',company:'TechVentures',branch:'West',verifiedDate:'2025-11-15',agents:2},
];

const AGENTS = [
  {id:'A1',name:'Sarah Agent',email:'sarah@company.com',role:'agent',permCount:13,perms:DEFAULT_PERMS},
  {id:'A2',name:'Marc Dupont',email:'marc@company.com',role:'agent',permCount:8,perms:DEFAULT_PERMS.slice(0,8)},
];

function PermList({perms,setPerms}:{perms:string[],setPerms:(p:string[])=>void}) {
  const toggle=(id:string)=>setPerms(perms.includes(id)?perms.filter(p=>p!==id):[...perms,id]);
  const toggleGroup=(ids:string[])=>{
    const allIn=ids.every(id=>perms.includes(id));
    setPerms(allIn?perms.filter(p=>!ids.includes(p)):[...new Set([...perms,...ids])]);
  };
  return (
    <View>
      {PERMISSIONS_GROUPS.map((group,gi)=>{
        const ids=group.items.map(i=>i.id);
        const allIn=ids.every(id=>perms.includes(id));
        return(
          <View key={gi} style={{marginBottom:16}}>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <Text style={{fontSize:13,fontWeight:'700',color:Colors.foreground}}>{group.group}</Text>
              <TouchableOpacity onPress={()=>toggleGroup(ids)}>
                <Text style={{fontSize:11,color:Colors.indigo600,fontWeight:'600'}}>{allIn?'Deselect All':'Select All'}</Text>
              </TouchableOpacity>
            </View>
            {group.items.map(item=>{
              const checked=perms.includes(item.id);
              return(
                <TouchableOpacity key={item.id} style={ad.permRow} onPress={()=>toggle(item.id)}>
                  <View style={[ad.checkbox,checked&&ad.checkboxOn]}>
                    {checked&&<Ionicons name="checkmark" size={11} color="#fff"/>}
                  </View>
                  <View style={{flex:1}}>
                    <Text style={{fontSize:13,fontWeight:'600',color:Colors.foreground}}>{item.label}</Text>
                    <Text style={{fontSize:11,color:Colors.gray500}}>{item.desc}</Text>
                  </View>
                  {checked&&<Ionicons name="checkmark" size={14} color="#16a34a"/>}
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

function PermissionsModal({agent,onClose}:{agent:any,onClose:()=>void}) {
  const [perms,setPerms] = useState<string[]>(agent?.perms||[]);
  return(
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{flex:1,backgroundColor:Colors.white}}>
        <View style={ad.modalHeader}>
          <View style={{flex:1}}>
            <Text style={ad.modalTitle}>Manage Permissions</Text>
            <Text style={{fontSize:12,color:Colors.gray500}}>{agent?.name} · {perms.length} selected</Text>
          </View>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={20} color={Colors.gray500}/></TouchableOpacity>
        </View>
        {/* Quick select */}
        <View style={{flexDirection:'row',gap:8,flexWrap:'wrap',padding:16,borderBottomWidth:1,borderBottomColor:Colors.gray100}}>
          <TouchableOpacity style={ad.quickBtn} onPress={()=>setPerms(DEFAULT_PERMS)}><Text style={ad.quickTxt}>Default Agent</Text></TouchableOpacity>
          <TouchableOpacity style={ad.quickBtn} onPress={()=>setPerms(ALL_PERMS)}><Text style={ad.quickTxt}>All Permissions</Text></TouchableOpacity>
          <TouchableOpacity style={ad.quickBtn} onPress={()=>setPerms([])}><Text style={ad.quickTxt}>Clear All</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{padding:16}}>
          <PermList perms={perms} setPerms={setPerms}/>
        </ScrollView>
        <View style={ad.modalFooter}>
          <TouchableOpacity style={ad.cancelBtn} onPress={onClose}><Text style={{fontSize:14,fontWeight:'600',color:Colors.foreground}}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity onPress={()=>{Alert.alert('✓ Saved','Permissions updated!');onClose();}}>
            <LinearGradient colors={[Colors.indigo600,Colors.violet600]} style={ad.saveBtn} start={{x:0,y:0}} end={{x:1,y:0}}>
              <Text style={{fontSize:14,fontWeight:'700',color:'#fff'}}>Save Permissions</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

type AdminTab='verification'|'permissions';

export function AdminScreen() {
  const [tab,setTab] = useState<AdminTab>('verification');
  const [pending,setPending] = useState(PENDING_MANAGERS);
  const [editingAgent,setEditingAgent] = useState<any>(null);

  const approve=(id:string)=>{
    setPending(p=>p.filter(m=>m.id!==id));
    Alert.alert('✓ Approved','Manager account approved and activated');
  };
  const reject=(id:string)=>{
    setPending(p=>p.filter(m=>m.id!==id));
    Alert.alert('Rejected','Manager request has been rejected');
  };

  return(
    <View style={{flex:1,backgroundColor:Colors.gray50}}>
      {editingAgent&&<PermissionsModal agent={editingAgent} onClose={()=>setEditingAgent(null)}/>}

      <View style={ad.pageHeader}>
        <Text style={ad.pageTitle}>Admin Panel</Text>
        <Text style={ad.pageSub}>Manager verification & user permissions</Text>
      </View>

      {/* Tab Bar */}
      <View style={ad.tabBar}>
        {([['verification','shield-checkmark-outline','Verification'],['permissions','people-outline','Permissions']] as const).map(([id,icon,label])=>(
          <TouchableOpacity key={id} style={[ad.tabBtn,tab===id&&ad.tabBtnActive]} onPress={()=>setTab(id)}>
            <Ionicons name={icon} size={16} color={tab===id?Colors.indigo600:Colors.gray500}/>
            <Text style={[ad.tabLabel,tab===id&&{color:Colors.indigo600,fontWeight:'700'}]}>{label}</Text>
            {id==='verification'&&pending.length>0&&<View style={ad.tabBadge}><Text style={{fontSize:9,color:'#fff',fontWeight:'800'}}>{pending.length}</Text></View>}
          </TouchableOpacity>
        ))}
      </View>

      {tab==='verification'&&(
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{padding:Spacing.base}}>
            {/* Pending */}
            <Text style={ad.sectionTitle}>Pending Requests ({pending.length})</Text>
            {pending.length===0?(
              <View style={[ad.emptyBox,Shadow.sm]}>
                <Ionicons name="checkmark-circle" size={40} color="#16a34a"/>
                <Text style={{fontSize:15,fontWeight:'700',color:Colors.foreground,marginTop:10}}>All caught up!</Text>
                <Text style={{fontSize:12,color:Colors.gray500,marginTop:4}}>No pending manager requests</Text>
              </View>
            ):pending.map(m=>(
              <View key={m.id} style={[ad.managerCard,Shadow.sm]}>
                <View style={ad.managerAvatar}>
                  <Text style={ad.managerAvatarTxt}>{m.name.charAt(0)}</Text>
                </View>
                <View style={{flex:1}}>
                  <Text style={ad.managerName}>{m.name}</Text>
                  <Text style={{fontSize:12,color:Colors.gray500}}>{m.email}</Text>
                  <View style={{flexDirection:'row',gap:8,marginTop:4}}>
                    <View style={ad.infoTag}><Ionicons name="business-outline" size={11} color={Colors.gray500}/><Text style={ad.infoTagTxt}>{m.company}</Text></View>
                    <View style={ad.infoTag}><Ionicons name="location-outline" size={11} color={Colors.gray500}/><Text style={ad.infoTagTxt}>{m.branch}</Text></View>
                  </View>
                  <Text style={{fontSize:10,color:Colors.gray400,marginTop:4}}>Requested: {m.date}</Text>
                </View>
                <View style={{gap:8}}>
                  <TouchableOpacity style={ad.approveBtn} onPress={()=>approve(m.id)}>
                    <Ionicons name="checkmark" size={14} color="#fff"/>
                    <Text style={{fontSize:12,fontWeight:'700',color:'#fff'}}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={ad.rejectBtn} onPress={()=>reject(m.id)}>
                    <Ionicons name="close" size={14} color="#dc2626"/>
                    <Text style={{fontSize:12,fontWeight:'700',color:'#dc2626'}}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Verified */}
            <Text style={[ad.sectionTitle,{marginTop:8}]}>Verified Managers ({VERIFIED_MANAGERS.length})</Text>
            {VERIFIED_MANAGERS.map(m=>(
              <View key={m.id} style={[ad.verifiedCard,Shadow.sm]}>
                <View style={[ad.managerAvatar,{backgroundColor:Colors.indigo600}]}>
                  <Text style={ad.managerAvatarTxt}>{m.name.charAt(0)}</Text>
                </View>
                <View style={{flex:1}}>
                  <Text style={ad.managerName}>{m.name}</Text>
                  <Text style={{fontSize:11,color:Colors.gray500}}>{m.email}</Text>
                  <View style={{flexDirection:'row',gap:6,marginTop:4}}>
                    <View style={ad.infoTag}><Text style={ad.infoTagTxt}>{m.branch}</Text></View>
                    <View style={[ad.infoTag,{backgroundColor:'#dcfce7'}]}><Text style={[ad.infoTagTxt,{color:'#16a34a'}]}>{m.agents} agents</Text></View>
                  </View>
                </View>
                <View style={ad.verifiedBadge}>
                  <Ionicons name="shield-checkmark" size={14} color="#16a34a"/>
                  <Text style={{fontSize:10,fontWeight:'700',color:'#16a34a'}}>Verified</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {tab==='permissions'&&(
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{padding:Spacing.base}}>
            <Text style={ad.sectionTitle}>Agent Accounts ({AGENTS.length})</Text>
            {AGENTS.map(agent=>(
              <View key={agent.id} style={[ad.agentCard,Shadow.sm]}>
                <View style={[ad.managerAvatar,{backgroundColor:Colors.violet600}]}>
                  <Text style={ad.managerAvatarTxt}>{agent.name.charAt(0)}</Text>
                </View>
                <View style={{flex:1}}>
                  <Text style={ad.managerName}>{agent.name}</Text>
                  <Text style={{fontSize:11,color:Colors.gray500}}>{agent.email}</Text>
                  <View style={{flexDirection:'row',alignItems:'center',gap:6,marginTop:4}}>
                    <View style={[ad.infoTag,{backgroundColor:Colors.indigo50}]}><Text style={[ad.infoTagTxt,{color:Colors.indigo600}]}>agent</Text></View>
                    <Text style={{fontSize:11,color:Colors.gray500}}>{agent.perms.length} permissions</Text>
                  </View>
                </View>
                <TouchableOpacity style={ad.editPermBtn} onPress={()=>setEditingAgent(agent)}>
                  <Ionicons name="settings-outline" size={14} color={Colors.indigo600}/>
                  <Text style={{fontSize:12,color:Colors.indigo600,fontWeight:'600'}}>Edit</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Create Agent Button */}
            <TouchableOpacity style={ad.createAgentBtn} onPress={()=>Alert.alert('Create Agent','Open Create Agent form')}>
              <LinearGradient colors={[Colors.indigo600,Colors.violet600]} style={ad.createAgentGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                <Ionicons name="person-add-outline" size={18} color="#fff"/>
                <Text style={{fontSize:15,fontWeight:'700',color:'#fff'}}>Create New Agent Account</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const ad = StyleSheet.create({
  pageHeader:{padding:Spacing.base,paddingBottom:12,backgroundColor:Colors.white,borderBottomWidth:1,borderBottomColor:Colors.gray100},
  pageTitle:{fontSize:24,fontWeight:'800',color:Colors.foreground},
  pageSub:{fontSize:13,color:Colors.gray500,marginTop:2},
  tabBar:{flexDirection:'row',backgroundColor:Colors.white,borderBottomWidth:1,borderBottomColor:Colors.gray100},
  tabBtn:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,paddingVertical:12,borderBottomWidth:2,borderBottomColor:'transparent',position:'relative'},
  tabBtnActive:{borderBottomColor:Colors.indigo600},
  tabLabel:{fontSize:12,fontWeight:'500',color:Colors.gray500},
  tabBadge:{backgroundColor:'#dc2626',borderRadius:8,minWidth:16,height:16,alignItems:'center',justifyContent:'center',paddingHorizontal:4},
  sectionTitle:{fontSize:17,fontWeight:'800',color:Colors.foreground,marginBottom:12},
  managerCard:{flexDirection:'row',alignItems:'flex-start',gap:12,backgroundColor:Colors.white,borderRadius:BorderRadius.xl,padding:14,marginBottom:10,borderWidth:1,borderColor:Colors.gray100},
  managerAvatar:{width:40,height:40,borderRadius:20,backgroundColor:Colors.gray200,alignItems:'center',justifyContent:'center'},
  managerAvatarTxt:{fontSize:16,fontWeight:'800',color:Colors.white},
  managerName:{fontSize:14,fontWeight:'700',color:Colors.foreground},
  infoTag:{flexDirection:'row',alignItems:'center',gap:3,backgroundColor:Colors.gray100,paddingHorizontal:7,paddingVertical:3,borderRadius:BorderRadius.full},
  infoTagTxt:{fontSize:10,color:Colors.gray600},
  approveBtn:{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'#16a34a',paddingHorizontal:10,paddingVertical:7,borderRadius:BorderRadius.lg},
  rejectBtn:{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'#fee2e2',paddingHorizontal:10,paddingVertical:7,borderRadius:BorderRadius.lg,borderWidth:1,borderColor:'#fecaca'},
  verifiedCard:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:Colors.white,borderRadius:BorderRadius.xl,padding:14,marginBottom:10,borderWidth:1,borderColor:'#dcfce7'},
  verifiedBadge:{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'#dcfce7',paddingHorizontal:8,paddingVertical:5,borderRadius:BorderRadius.full},
  emptyBox:{backgroundColor:Colors.white,borderRadius:BorderRadius.xl,padding:32,alignItems:'center',marginBottom:16,borderWidth:1,borderColor:Colors.gray100},
  agentCard:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:Colors.white,borderRadius:BorderRadius.xl,padding:14,marginBottom:10,borderWidth:1,borderColor:Colors.gray100},
  editPermBtn:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:12,paddingVertical:7,borderRadius:BorderRadius.lg,backgroundColor:Colors.indigo50,borderWidth:1,borderColor:Colors.indigo100},
  createAgentBtn:{marginTop:8,borderRadius:BorderRadius.xl,overflow:'hidden'},
  createAgentGrad:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,paddingVertical:16},
  permRow:{flexDirection:'row',alignItems:'center',gap:12,padding:12,backgroundColor:Colors.gray50,borderRadius:BorderRadius.lg,marginBottom:6},
  checkbox:{width:18,height:18,borderRadius:4,borderWidth:2,borderColor:Colors.gray300,alignItems:'center',justifyContent:'center'},
  checkboxOn:{backgroundColor:Colors.indigo600,borderColor:Colors.indigo600},
  modalHeader:{flexDirection:'row',alignItems:'center',padding:20,paddingTop:24,borderBottomWidth:1,borderBottomColor:Colors.gray100},
  modalTitle:{fontSize:18,fontWeight:'800',color:Colors.foreground},
  quickBtn:{paddingHorizontal:12,paddingVertical:6,borderRadius:BorderRadius.lg,backgroundColor:Colors.white,borderWidth:1,borderColor:Colors.gray200},
  quickTxt:{fontSize:12,fontWeight:'600',color:Colors.foreground},
  modalFooter:{flexDirection:'row',gap:12,padding:16,borderTopWidth:1,borderTopColor:Colors.gray100},
  cancelBtn:{flex:1,paddingVertical:13,borderRadius:BorderRadius.lg,backgroundColor:Colors.gray100,alignItems:'center'},
  saveBtn:{flex:2,paddingVertical:13,borderRadius:BorderRadius.lg,alignItems:'center'},
});
