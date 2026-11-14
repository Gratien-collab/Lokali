// Lokali – code de départ (React Native / Expo)
// Aucune bibliothèque supplémentaire : tout fonctionne avec le modèle Expo de base.
import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StatusBar, Platform,
  KeyboardAvoidingView, Modal, StyleSheet,
} from 'react-native';

const C = {
  bg: '#04060E', surface: '#0A1330', surface2: '#101C45', ink: '#EAF0FF',
  muted: '#9AA8CC', line: '#1B2858', accent: '#3D7BFF', ok: '#4FC3F7',
};

const ROLES = {
  bailleur: { n: 'Bailleur', d: 'Je loue mes biens' },
  locataire: { n: 'Locataire', d: 'Je cherche un logement' },
  commercant: { n: 'Commerçant', d: 'Je cherche un local ou un étal' },
  commissionnaire: { n: 'Commissionnaire', d: 'Je fais le lien et je touche une commission' },
};

const fmt = (n) => n.toLocaleString('fr-FR') + ' FCFA';
let nextId = 10;

const START_LISTINGS = [
  { id: 1, t: 'Chambre salon moderne', type: 'Logement', q: 'Cocody', p: 85000, o: 'M. Diallo', d: '2 pièces, eau et électricité, sécurisé, proche transport.' },
  { id: 2, t: 'Boutique face au marché', type: 'Boutique', q: 'Adjamé', p: 120000, o: 'Mme Koné', d: '18 m², vitrine, forte affluence, rideau métallique.' },
  { id: 3, t: 'Étal couvert', type: 'Étal', q: 'Marché Treichville', p: 25000, o: 'M. Traoré', d: 'Emplacement couvert, entrée principale.' },
  { id: 4, t: 'Studio meublé', type: 'Logement', q: 'Yopougon', p: 60000, o: 'Mme Bamba', d: 'Studio meublé, compteur individuel, cour commune.' },
];

// ---------- Petits composants ----------
const Btn = ({ label, onPress, alt }) => (
  <Pressable onPress={onPress} style={[s.btn, alt && s.btnAlt]} accessibilityRole="button">
    <Text style={s.btnText}>{label}</Text>
  </Pressable>
);
const Badge = ({ label, wait }) => (
  <Text style={[s.badge, wait && { color: '#B8CCFF' }]}>{label}</Text>
);
const Chip = ({ label, on, onPress }) => (
  <Pressable onPress={onPress} style={[s.chip, on && s.chipOn]}>
    <Text style={{ color: C.ink }}>{label}</Text>
  </Pressable>
);
const Header = ({ title, onBack }) => (
  <View style={s.header}>
    {onBack && (
      <Pressable onPress={onBack} style={s.back} accessibilityLabel="Retour">
        <Text style={{ color: C.ink, fontSize: 18 }}>←</Text>
      </Pressable>
    )}
    <Text style={s.title}>{title}</Text>
  </View>
);

// ---------- Application ----------
export default function App() {
  const [role, setRole] = useState(null);
  const [tab, setTab] = useState('home');
  const [stack, setStack] = useState([]);
  const [filter, setFilter] = useState('Tous');
  const [listings, setListings] = useState(START_LISTINGS);
  const [visits, setVisits] = useState([{ id: 1, l: 'Boutique face au marché', who: 'Awa S.', date: 'Lundi 10h', st: 'En attente' }]);
  const [threads, setThreads] = useState({ 1: { with: 'M. Diallo', about: 'Chambre salon moderne', msgs: [{ me: false, t: 'Bonjour, le logement est toujours libre.' }] } });
  const [pays, setPays] = useState([{ t: "Loyer de novembre", a: 85000, st: 'À payer' }, { t: "Loyer d'octobre", a: 85000, st: 'Payé' }]);
  const [payIndex, setPayIndex] = useState(null);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ t: '', type: 'Logement', q: '', p: '' });
  const [draft, setDraft] = useState('');

  const cur = stack[stack.length - 1];
  const push = (x) => setStack([...stack, x]);
  const back = () => setStack(stack.slice(0, -1));
  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 1800); };

  // ----- Actions -----
  const publish = () => {
    const p = parseInt(form.p, 10);
    if (!form.t.trim() || !form.q.trim() || !p) return say('Remplissez le titre, le quartier et le loyer.');
    setListings([{ id: nextId++, t: form.t.trim(), type: form.type, q: form.q.trim(), p, o: 'Vous', d: 'Annonce publiée depuis votre compte.' }, ...listings]);
    setForm({ t: '', type: 'Logement', q: '', p: '' });
    setStack([]);
    say('Bien publié');
  };
  const contact = (l) => {
    if (!threads[l.id]) setThreads({ ...threads, [l.id]: { with: l.o, about: l.t, msgs: [] } });
    setStack([{ k: 'thread', id: l.id }]);
  };
  const askVisit = (l) => {
    setVisits([...visits, { id: nextId++, l: l.t, who: 'Vous', date: 'Samedi 9h', st: 'En attente' }]);
    say('Demande envoyée. Un commissionnaire va la confirmer.');
  };
  const acceptVisit = (id) => {
    setVisits(visits.map((v) => (v.id === id ? { ...v, st: 'Confirmée' } : v)));
    say('Visite confirmée');
  };
  const send = (id) => {
    const t = draft.trim();
    if (!t) return;
    setThreads((old) => ({ ...old, [id]: { ...old[id], msgs: [...old[id].msgs, { me: true, t }] } }));
    setDraft('');
    setTimeout(() => {
      setThreads((old) => ({ ...old, [id]: { ...old[id], msgs: [...old[id].msgs, { me: false, t: 'Bien reçu, je vous réponds dans un instant.' }] } }));
    }, 1200);
  };
  const pay = (operator) => {
    setPays(pays.map((p, i) => (i === payIndex ? { ...p, st: 'Payé' } : p)));
    setPayIndex(null);
    say('Payé avec ' + operator + '. Reçu enregistré.');
  };

  // ----- Écrans -----
  const ListingCard = ({ l }) => (
    <Pressable style={s.card} onPress={() => push({ k: 'detail', id: l.id })}>
      <View style={s.row}><Text style={s.h3}>{l.t}</Text><Badge label={l.type} /></View>
      <Text style={s.muted}>{l.q} · {l.o}</Text>
      <Text style={[s.price, { marginTop: 6 }]}>{fmt(l.p)} / mois</Text>
    </Pressable>
  );

  const RoleScreen = () => (
    <>
      <Header title="Lokali" />
      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.hero}>Qui êtes-vous ?</Text>
        <Text style={[s.muted, { marginBottom: 18 }]}>Choisissez un rôle pour voir l'appli de son point de vue.</Text>
        {Object.entries(ROLES).map(([k, v]) => (
          <Pressable key={k} style={s.card} onPress={() => { setRole(k); setTab('home'); setStack([]); }}>
            <Text style={s.h3}>{v.n}</Text><Text style={s.muted}>{v.d}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </>
  );

  const HomeScreen = () => {
    if (role === 'bailleur') return (
      <>
        <Header title="Mes biens" />
        <ScrollView contentContainerStyle={s.body}>
          <View style={s.stats}>
            <View style={s.stat}><Text style={s.big}>{listings.length}</Text><Text style={s.muted}>biens publiés</Text></View>
            <View style={s.stat}><Text style={s.big}>{visits.length}</Text><Text style={s.muted}>demande(s) de visite</Text></View>
          </View>
          <Btn label="Publier un bien" onPress={() => push({ k: 'publish' })} />
          <View style={{ height: 14 }} />
          {listings.map((l) => <ListingCard key={l.id} l={l} />)}
        </ScrollView>
      </>
    );
    if (role === 'commissionnaire') return (
      <>
        <Header title="Demandes de visite" />
        <ScrollView contentContainerStyle={s.body}>
          {visits.length === 0 && <Text style={s.muted}>Aucune demande pour le moment.</Text>}
          {visits.map((v) => (
            <View key={v.id} style={s.card}>
              <View style={s.row}><Text style={s.h3}>{v.l}</Text><Badge label={v.st} wait={v.st !== 'Confirmée'} /></View>
              <Text style={s.muted}>{v.who} · {v.date}</Text>
              {v.st !== 'Confirmée' && <View style={{ marginTop: 12 }}><Btn label="Confirmer la visite" onPress={() => acceptVisit(v.id)} /></View>}
            </View>
          ))}
        </ScrollView>
      </>
    );
    const list = listings.filter((l) => filter === 'Tous' || l.type === filter);
    return (
      <>
        <Header title={role === 'locataire' ? 'Trouver un logement' : 'Trouver un local'} />
        <ScrollView contentContainerStyle={s.body}>
          <View style={s.chips}>
            {['Tous', 'Logement', 'Boutique', 'Étal'].map((f) => <Chip key={f} label={f} on={filter === f} onPress={() => setFilter(f)} />)}
          </View>
          {list.length === 0 && <Text style={s.muted}>Aucune annonce pour ce filtre. Essayez « Tous ».</Text>}
          {list.map((l) => <ListingCard key={l.id} l={l} />)}
        </ScrollView>
      </>
    );
  };

  const DetailScreen = ({ id }) => {
    const l = listings.find((x) => x.id === id);
    const canAct = role === 'locataire' || role === 'commercant';
    return (
      <>
        <Header title={l.t} onBack={back} />
        <ScrollView contentContainerStyle={s.body}>
          <View style={s.card}>
            <Badge label={l.type} />
            <Text style={[s.price, { fontSize: 24, marginVertical: 10 }]}>{fmt(l.p)} / mois</Text>
            <Text style={s.muted}>{l.q}</Text>
            <Text style={{ color: C.ink, marginVertical: 10 }}>{l.d}</Text>
            <Text style={s.muted}>Bailleur : {l.o} · profil vérifié</Text>
          </View>
          {canAct ? (
            <>
              <Btn label="Écrire au bailleur" onPress={() => contact(l)} />
              <View style={{ height: 10 }} />
              <Btn alt label="Demander une visite" onPress={() => askVisit(l)} />
            </>
          ) : <Text style={s.muted}>Changez de rôle dans Profil pour contacter le bailleur.</Text>}
        </ScrollView>
      </>
    );
  };

  const PublishScreen = () => (
    <>
      <Header title="Publier un bien" onBack={back} />
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        <Text style={s.label}>Titre</Text>
        <TextInput style={s.input} value={form.t} onChangeText={(t) => setForm({ ...form, t })} placeholder="Ex : Boutique avec vitrine" placeholderTextColor={C.muted} />
        <Text style={s.label}>Type</Text>
        <View style={s.chips}>
          {['Logement', 'Boutique', 'Étal'].map((t) => <Chip key={t} label={t} on={form.type === t} onPress={() => setForm({ ...form, type: t })} />)}
        </View>
        <Text style={s.label}>Quartier</Text>
        <TextInput style={s.input} value={form.q} onChangeText={(q) => setForm({ ...form, q })} placeholder="Ex : Cocody" placeholderTextColor={C.muted} />
        <Text style={s.label}>Loyer par mois (FCFA)</Text>
        <TextInput style={s.input} value={form.p} onChangeText={(p) => setForm({ ...form, p })} keyboardType="numeric" placeholder="85000" placeholderTextColor={C.muted} />
        <View style={{ height: 18 }} />
        <Btn label="Publier" onPress={publish} />
      </ScrollView>
    </>
  );

  const MessagesScreen = () => (
    <>
      <Header title="Messages" />
      <ScrollView contentContainerStyle={s.body}>
        {Object.keys(threads).length === 0 && <Text style={s.muted}>Aucun message. Ouvrez une annonce et écrivez au bailleur.</Text>}
        {Object.entries(threads).map(([id, t]) => (
          <Pressable key={id} style={s.card} onPress={() => push({ k: 'thread', id: Number(id) })}>
            <Text style={s.h3}>{t.with}</Text>
            <Text style={s.muted}>{t.about}</Text>
            {t.msgs.length > 0 && <Text style={{ color: C.ink, marginTop: 4 }}>{t.msgs[t.msgs.length - 1].t}</Text>}
          </Pressable>
        ))}
      </ScrollView>
    </>
  );

  const ThreadScreen = ({ id }) => {
    const t = threads[id];
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Header title={t.with} onBack={back} />
        <ScrollView contentContainerStyle={[s.body, { gap: 8 }]}>
          {t.msgs.map((m, i) => (
            <View key={i} style={[s.msg, m.me && s.msgMe]}><Text style={{ color: C.ink }}>{m.t}</Text></View>
          ))}
        </ScrollView>
        <View style={s.sendbar}>
          <TextInput style={[s.input, { flex: 1 }]} value={draft} onChangeText={setDraft} placeholder="Votre message" placeholderTextColor={C.muted} onSubmitEditing={() => send(id)} />
          <Pressable style={s.sendBtn} onPress={() => send(id)}><Text style={s.btnText}>Envoyer</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  };

  const PayScreen = () => {
    const seeker = role === 'locataire' || role === 'commercant';
    let rows = pays;
    let title = 'Mes paiements';
    if (role === 'bailleur') { title = 'Loyers reçus'; rows = [{ t: 'Loyer de novembre · Mme Koné', a: 120000, st: 'Payé' }, { t: 'Loyer de novembre · M. Yao', a: 85000, st: 'En attente' }]; }
    if (role === 'commissionnaire') { title = 'Mes commissions'; rows = [{ t: 'Commission · Studio Yopougon', a: 30000, st: 'Payé' }, { t: 'Commission · Boutique Adjamé', a: 60000, st: 'En attente' }]; }
    return (
      <>
        <Header title={title} />
        <ScrollView contentContainerStyle={s.body}>
          {rows.map((p, i) => (
            <View key={i} style={s.card}>
              <View style={s.row}><Text style={s.h3}>{p.t}</Text><Badge label={p.st} wait={p.st !== 'Payé'} /></View>
              <Text style={s.price}>{fmt(p.a)}</Text>
              {seeker && p.st === 'À payer' && <View style={{ marginTop: 12 }}><Btn label="Payer par Mobile Money" onPress={() => setPayIndex(i)} /></View>}
            </View>
          ))}
          <Text style={s.muted}>Chaque paiement génère un reçu enregistré dans l'appli.</Text>
        </ScrollView>
      </>
    );
  };

  const ProfileScreen = () => (
    <>
      <Header title="Profil" />
      <ScrollView contentContainerStyle={s.body}>
        <View style={s.card}><Text style={s.h3}>{ROLES[role].n}</Text><Text style={s.muted}>Profil vérifié · Note 4,8 sur 5</Text></View>
        <Btn alt label="Changer de rôle" onPress={() => { setRole(null); setStack([]); }} />
      </ScrollView>
    </>
  );

  // ----- Choix de l'écran -----
  let screen;
  if (!role) screen = <RoleScreen />;
  else if (cur?.k === 'detail') screen = <DetailScreen id={cur.id} />;
  else if (cur?.k === 'publish') screen = <PublishScreen />;
  else if (cur?.k === 'thread') screen = <ThreadScreen id={cur.id} />;
  else screen = tab === 'home' ? <HomeScreen /> : tab === 'msg' ? <MessagesScreen /> : tab === 'pay' ? <PayScreen /> : <ProfileScreen />;

  const payLabel = role === 'commissionnaire' ? 'Commissions' : role === 'bailleur' ? 'Revenus' : 'Paiements';
  const tabs = [['home', 'Accueil'], ['msg', 'Messages'], ['pay', payLabel], ['me', 'Profil']];

  return (
    <View style={s.app}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={{ flex: 1 }}>{screen}</View>
      {role && !cur && (
        <View style={s.tabs}>
          {tabs.map(([k, label]) => (
            <Pressable key={k} style={[s.tab, tab === k && s.tabOn]} onPress={() => { setTab(k); setStack([]); }}>
              <Text style={{ color: tab === k ? C.accent : C.muted, fontWeight: '600', fontSize: 13 }}>{label}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <Modal visible={payIndex !== null} transparent animationType="slide" onRequestClose={() => setPayIndex(null)}>
        <View style={s.modalBg}>
          <View style={s.sheet}>
            <Text style={s.h3}>Payer {payIndex !== null ? fmt(pays[payIndex].a) : ''}</Text>
            <Text style={[s.muted, { marginBottom: 12 }]}>Choisissez votre service de paiement.</Text>
            {['Orange Money', 'MTN MoMo', 'Wave'].map((o) => (
              <View key={o} style={{ marginBottom: 10 }}><Btn alt label={o} onPress={() => pay(o)} /></View>
            ))}
            <Btn alt label="Annuler" onPress={() => setPayIndex(null)} />
          </View>
        </View>
      </Modal>
      {!!toast && <View style={s.toast}><Text style={{ color: C.bg, fontWeight: '700', textAlign: 'center' }}>{toast}</Text></View>}
    </View>
  );
}

// ---------- Styles ----------
const s = StyleSheet.create({
  app: { flex: 1, backgroundColor: C.bg, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 32) : 44 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 14 },
  title: { flex: 1, color: C.ink, fontSize: 20, fontWeight: '800' },
  back: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 20, paddingBottom: 24 },
  hero: { color: C.ink, fontSize: 30, fontWeight: '800', marginVertical: 8 },
  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 16, marginBottom: 12 },
  h3: { color: C.ink, fontSize: 17, fontWeight: '700', flexShrink: 1 },
  muted: { color: C.muted, fontSize: 14 },
  price: { color: C.ok, fontWeight: '800' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 4 },
  badge: { backgroundColor: C.surface2, color: C.ok, fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, overflow: 'hidden', alignSelf: 'flex-start' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  chipOn: { backgroundColor: C.accent, borderColor: C.accent },
  btn: { backgroundColor: C.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnAlt: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  stats: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  stat: { flex: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 14 },
  big: { color: C.ink, fontSize: 22, fontWeight: '800' },
  label: { color: C.muted, fontSize: 14, marginTop: 12, marginBottom: 4 },
  input: { backgroundColor: C.surface, color: C.ink, borderWidth: 1, borderColor: C.line, borderRadius: 10, padding: 12, fontSize: 16 },
  msg: { maxWidth: '80%', padding: 10, borderRadius: 16, backgroundColor: C.surface2, alignSelf: 'flex-start' },
  msgMe: { backgroundColor: C.accent, alignSelf: 'flex-end' },
  sendbar: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.surface },
  sendBtn: { backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  tabs: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.surface },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabOn: { borderTopWidth: 3, borderTopColor: C.accent, paddingTop: 11 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22 },
  toast: { position: 'absolute', left: 20, right: 20, bottom: 90, backgroundColor: C.ok, padding: 12, borderRadius: 12 },
});
