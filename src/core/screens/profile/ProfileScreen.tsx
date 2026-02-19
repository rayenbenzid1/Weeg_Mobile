import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

const MY_PERMISSIONS = [
  'View Dashboard','View Reports','Generate Reports','View KPIs',
  'Filter Dashboard','AI Insights','View Sales','View Inventory',
  'View Customer Payments','Receive Notifications','Manage Alerts',
  'View Profile','Change Password','Import Data','Export Data','View Aging Receivables',
];

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<'account'|'settings'|'permissions'>('account');
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [notifs, setNotifs] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [emailReports, setEmailReports] = useState(false);

  const changePassword = () => {
    if (!oldPw||!newPw||!confirmPw) { Alert.alert('Error','Please fill all fields'); return; }
    if (newPw!==confirmPw) { Alert.alert('Error','New passwords do not match'); return; }
    if (newPw.length<8) { Alert.alert('Error','Password must be at least 8 characters'); return; }
    Alert.alert('✓ Success','Password changed successfully');
    setOldPw(''); setNewPw(''); setConfirmPw('');
  };

  return (
    <View style={{flex:1,backgroundColor:Colors.gray50}}>
      {/* Profile Header */}
      <LinearGradient colors={[Colors.indigo600,Colors.violet600]} style={ps.profileHeader} start={{x:0,y:0}} end={{x:1,y:1}}>
        <View style={ps.avatar}>
          <Text style={ps.avatarTxt}>{(user?.name||'J').charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={ps.profileName}>{user?.name||'John Manager'}</Text>
        <Text style={ps.profileEmail}>{user?.email||'john@company.com'}</Text>
        <View style={ps.roleBadge}>
          <Text style={ps.roleTxt}>{(user?.role||'manager').toUpperCase()}</Text>
        </View>
      </LinearGradient>

      {/* Tab Bar */}
      <View style={ps.tabBar}>
        {([['account','person-outline','Account'],['settings','settings-outline','Settings'],['permissions','shield-outline','Permissions']] as const).map(([id,icon,label])=>(
          <TouchableOpacity key={id} style={[ps.tabBtn,tab===id&&ps.tabBtnActive]} onPress={()=>setTab(id)}>
            <Ionicons name={icon} size={16} color={tab===id?Colors.indigo600:Colors.gray500}/>
            <Text style={[ps.tabLabel,tab===id&&{color:Colors.indigo600,fontWeight:'700'}]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{padding:Spacing.base,paddingBottom:40}}>

          {/* ── Account Tab ── */}
          {tab==='account'&&(
            <>
              <View style={[ps.card,Shadow.sm,{marginBottom:16}]}>
                <Text style={ps.cardTitle}>My Information</Text>
                <View style={ps.infoRow}><Ionicons name="person-outline" size={16} color={Colors.gray400}/><Text style={ps.infoLabel}>Name</Text><Text style={ps.infoVal}>{user?.name||'John Manager'}</Text></View>
                <View style={ps.infoRow}><Ionicons name="mail-outline" size={16} color={Colors.gray400}/><Text style={ps.infoLabel}>Email</Text><Text style={ps.infoVal}>{user?.email||'john@company.com'}</Text></View>
                <View style={ps.infoRow}><Ionicons name="briefcase-outline" size={16} color={Colors.gray400}/><Text style={ps.infoLabel}>Role</Text><Text style={[ps.infoVal,{color:Colors.indigo600,fontWeight:'700',textTransform:'capitalize'}]}>{user?.role||'manager'}</Text></View>
                <View style={[ps.infoRow,{borderBottomWidth:0}]}><Ionicons name="shield-checkmark-outline" size={16} color={'#16a34a'}/><Text style={ps.infoLabel}>Status</Text><Text style={[ps.infoVal,{color:'#16a34a',fontWeight:'700'}]}>Verified</Text></View>
              </View>

              {/* Change Password */}
              <View style={[ps.card,Shadow.sm,{marginBottom:16}]}>
                <Text style={ps.cardTitle}>Change Password</Text>
                <Text style={{fontSize:12,color:Colors.gray500,marginBottom:14}}>Update your account password</Text>
                <View style={ps.inputRow}>
                  <Text style={ps.inputLabel}>Current Password</Text>
                  <View style={ps.inputBox}>
                    <TextInput value={oldPw} onChangeText={setOldPw} secureTextEntry={!showOld} placeholder="Enter current password" placeholderTextColor={Colors.gray400} style={ps.input}/>
                    <TouchableOpacity onPress={()=>setShowOld(!showOld)}><Ionicons name={showOld?'eye-off-outline':'eye-outline'} size={18} color={Colors.gray400}/></TouchableOpacity>
                  </View>
                </View>
                <View style={ps.inputRow}>
                  <Text style={ps.inputLabel}>New Password</Text>
                  <View style={ps.inputBox}>
                    <TextInput value={newPw} onChangeText={setNewPw} secureTextEntry={!showNew} placeholder="Min. 8 characters" placeholderTextColor={Colors.gray400} style={ps.input}/>
                    <TouchableOpacity onPress={()=>setShowNew(!showNew)}><Ionicons name={showNew?'eye-off-outline':'eye-outline'} size={18} color={Colors.gray400}/></TouchableOpacity>
                  </View>
                </View>
                <View style={[ps.inputRow,{marginBottom:16}]}>
                  <Text style={ps.inputLabel}>Confirm New Password</Text>
                  <View style={ps.inputBox}>
                    <TextInput value={confirmPw} onChangeText={setConfirmPw} secureTextEntry placeholder="Repeat new password" placeholderTextColor={Colors.gray400} style={ps.input}/>
                  </View>
                </View>
                <TouchableOpacity onPress={changePassword}>
                  <LinearGradient colors={[Colors.indigo600,Colors.violet600]} style={ps.saveBtn} start={{x:0,y:0}} end={{x:1,y:0}}>
                    <Ionicons name="lock-closed-outline" size={16} color="#fff"/>
                    <Text style={{fontSize:14,fontWeight:'700',color:'#fff'}}>Update Password</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Logout */}
              <TouchableOpacity style={[ps.logoutBtn,Shadow.sm]} onPress={()=>Alert.alert('Log out','Are you sure?',[{text:'Cancel'},{text:'Log out',style:'destructive',onPress:logout}])}>
                <Ionicons name="log-out-outline" size={18} color="#dc2626"/>
                <Text style={{fontSize:15,fontWeight:'700',color:'#dc2626'}}>Log Out</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Settings Tab ── */}
          {tab==='settings'&&(
            <View style={[ps.card,Shadow.sm]}>
              <Text style={ps.cardTitle}>Notifications & Preferences</Text>
              {[
                {label:'Push Notifications',desc:'Receive real-time alerts on your device',val:notifs,set:setNotifs},
                {label:'Critical Alerts',desc:'Immediate notifications for critical events',val:pushAlerts,set:setPushAlerts},
                {label:'Email Reports',desc:'Receive daily summary reports by email',val:emailReports,set:setEmailReports},
              ].map((item,i)=>(
                <View key={i} style={ps.settingRow}>
                  <View style={{flex:1}}>
                    <Text style={{fontSize:14,fontWeight:'600',color:Colors.foreground}}>{item.label}</Text>
                    <Text style={{fontSize:12,color:Colors.gray500,marginTop:2}}>{item.desc}</Text>
                  </View>
                  <Switch value={item.val} onValueChange={item.set} trackColor={{false:Colors.gray200,true:Colors.indigo600}} thumbColor="#fff"/>
                </View>
              ))}
            </View>
          )}

          {/* ── Permissions Tab ── */}
          {tab==='permissions'&&(
            <View style={[ps.card,Shadow.sm]}>
              <Text style={ps.cardTitle}>My Permissions</Text>
              <Text style={{fontSize:12,color:Colors.gray500,marginBottom:14}}>Features and access granted to your account ({MY_PERMISSIONS.length} total)</Text>
              <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
                {MY_PERMISSIONS.map((p,i)=>(
                  <View key={i} style={ps.permChip}>
                    <Ionicons name="checkmark-circle" size={13} color="#16a34a"/>
                    <Text style={ps.permChipTxt}>{p}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

        </View>
      </ScrollView>
    </View>
  );
}

const ps = StyleSheet.create({
  profileHeader:{padding:24,paddingTop:32,alignItems:'center'},
  avatar:{width:72,height:72,borderRadius:36,backgroundColor:'rgba(255,255,255,0.25)',alignItems:'center',justifyContent:'center',marginBottom:12},
  avatarTxt:{fontSize:28,fontWeight:'900',color:'#fff'},
  profileName:{fontSize:20,fontWeight:'800',color:'#fff',marginBottom:4},
  profileEmail:{fontSize:13,color:'rgba(255,255,255,0.8)',marginBottom:8},
  roleBadge:{backgroundColor:'rgba(255,255,255,0.2)',paddingHorizontal:14,paddingVertical:5,borderRadius:BorderRadius.full},
  roleTxt:{fontSize:11,fontWeight:'800',color:'#fff'},
  tabBar:{flexDirection:'row',backgroundColor:Colors.white,borderBottomWidth:1,borderBottomColor:Colors.gray100},
  tabBtn:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,paddingVertical:12,borderBottomWidth:2,borderBottomColor:'transparent'},
  tabBtnActive:{borderBottomColor:Colors.indigo600},
  tabLabel:{fontSize:11,fontWeight:'500',color:Colors.gray500},
  card:{backgroundColor:Colors.white,borderRadius:BorderRadius.xl,padding:16,borderWidth:1,borderColor:Colors.gray100},
  cardTitle:{fontSize:15,fontWeight:'700',color:Colors.foreground,marginBottom:14},
  infoRow:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:12,borderBottomWidth:1,borderBottomColor:Colors.gray50},
  infoLabel:{fontSize:13,color:Colors.gray500,width:70},
  infoVal:{flex:1,fontSize:13,fontWeight:'600',color:Colors.foreground,textAlign:'right'},
  inputRow:{marginBottom:12},
  inputLabel:{fontSize:12,fontWeight:'600',color:Colors.foreground,marginBottom:6},
  inputBox:{flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:Colors.gray200,borderRadius:BorderRadius.lg,paddingHorizontal:12,paddingVertical:10,backgroundColor:Colors.gray50},
  input:{flex:1,fontSize:13,color:Colors.foreground},
  saveBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingVertical:13,borderRadius:BorderRadius.lg},
  logoutBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,backgroundColor:Colors.white,borderRadius:BorderRadius.xl,paddingVertical:16,borderWidth:1,borderColor:'#fecaca'},
  settingRow:{flexDirection:'row',alignItems:'center',paddingVertical:14,borderBottomWidth:1,borderBottomColor:Colors.gray50},
  permChip:{flexDirection:'row',alignItems:'center',gap:5,backgroundColor:Colors.gray50,borderRadius:BorderRadius.full,paddingHorizontal:10,paddingVertical:5,borderWidth:1,borderColor:Colors.gray100},
  permChipTxt:{fontSize:11,color:Colors.foreground,fontWeight:'500'},
});
