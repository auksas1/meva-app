/* eslint-disable */
// Top-level app — routes between screens and provides sample data.

const SAMPLE_RESULTS = [
  {
    id: 101, image_filename: 'shot_1.jpg', damage_score: 0.72,
    damage_zones: [
      { label: 'Dent', confidence: 0.91, bbox: [0.1,0.2,0.4,0.5] },
      { label: 'Scratch', confidence: 0.66, bbox: [0.3,0.4,0.6,0.5] },
    ],
    status: 'completed', created_at: '2026-05-24T10:14:00Z',
    vehicle_brand: 'Toyota', vehicle_model: 'Corolla', vehicle_year: 2018,
    affected_parts: [
      { name: 'Front bumper', estimated_cost: 420 },
      { name: 'Right headlight', estimated_cost: 180 },
    ],
    total_estimated_cost: 600,
    repair_recommendation: 'Significant damage on the front-right quarter. Schedule a professional repair before driving longer distances — replacing the headlight is recommended.',
  },
  {
    id: 102, image_filename: 'shot_2.jpg', damage_score: 0.41,
    damage_zones: [{ label: 'Scratch', confidence: 0.78, bbox: [0.2,0.3,0.5,0.4] }],
    status: 'completed', created_at: '2026-05-24T10:14:00Z',
    affected_parts: [{ name: 'Left fender', estimated_cost: 350 }],
    total_estimated_cost: 350,
    repair_recommendation: 'Moderate cosmetic scratching. A body shop can buff and repaint without panel replacement.',
  },
];

const INITIAL_VEHICLES = [
  { id: 'v1', brand: 'Toyota', model: 'Corolla', year: 2018, licensePlate: 'AA-123-BB', createdAt: '2026-05-10T09:00:00Z' },
  { id: 'v2', brand: 'BMW', model: '3 Series', year: 2020, licensePlate: 'CD-456-EF', createdAt: '2026-05-12T09:00:00Z' },
];
const INITIAL_SESSIONS = [
  {
    id: 's1', vehicleId: 'v1', createdAt: 'May 24, 2026, 10:14',
    photos: [
      { localUri: window.AD_PHOTOS[0], result: SAMPLE_RESULTS[0] },
      { localUri: window.AD_PHOTOS[1], result: SAMPLE_RESULTS[1] },
    ],
    repairs: [
      { id: 'r1', performedAt: 'May 12, 2026', performedBy: 'BodyShop GmbH', workDescription: 'Replaced front bumper, repainted hood section.', actualCost: 420, notes: 'Warranty 12 months' },
    ],
  },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function App({ dark, onToggleDark }) {
  const T = window.AD_T;
  const [tab, setTab] = React.useState('analyze');
  const [route, setRoute] = React.useState({ name: 'home' });
  const [selectedPhotos, setSelectedPhotos] = React.useState([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitPhase, setSubmitPhase] = React.useState('validating');
  const [submitProgress, setSubmitProgress] = React.useState({ current: 0, total: 0 });
  const [vehicles, setVehicles] = React.useState(INITIAL_VEHICLES);
  const [sessions, setSessions] = React.useState(INITIAL_SESSIONS);
  const [user, setUser] = React.useState(null);
  const [backendUrl, setBackendUrl] = React.useState('http://10.0.2.2:8000');
  const [quality, setQuality] = React.useState('medium');
  const [connectionStatus, setConnectionStatus] = React.useState(null);

  const addSamplePhotos = () => {
    const next = window.AD_PHOTOS.slice(0, 2).map((u, i) => ({ id: `p${Date.now()}-${i}`, uri: u }));
    setSelectedPhotos(prev => [...prev, ...next].slice(0, 4));
  };
  const removePhoto = (id) => setSelectedPhotos(prev => prev.filter(p => p.id !== id));

  const handleSubmit = async () => {
    setSubmitting(true); setSubmitPhase('validating'); setSubmitProgress({ current: 0, total: selectedPhotos.length });
    await sleep(700);
    setSubmitPhase('uploading');
    for (let i = 0; i < selectedPhotos.length; i++) {
      setSubmitProgress({ current: i + 1, total: selectedPhotos.length });
      await sleep(700);
    }
    setSubmitting(false);
    const draft = selectedPhotos.map((p, i) => ({ localUri: p.uri, result: SAMPLE_RESULTS[i % SAMPLE_RESULTS.length] }));
    setRoute({ name: 'pickVehicle', draft });
  };

  const handlePickVehicle = (v) => {
    if (!vehicles.find(x => x.id === v.id)) setVehicles(prev => [...prev, v]);
    const newSession = { id: 's' + Date.now(), vehicleId: v.id, createdAt: new Date().toLocaleString(), photos: route.draft, repairs: [] };
    setSessions(prev => [newSession, ...prev]);
    setSelectedPhotos([]);
    setRoute({ name: 'results', sessionId: newSession.id });
  };

  let content, title = '', subtitle = '', onBack = null;

  if (tab === 'analyze') {
    if (route.name === 'home') {
      title = 'Analyze'; subtitle = 'AI vehicle inspection';
      content = (
        <AnalyzeHome
          photos={selectedPhotos}
          onAddSample={addSamplePhotos}
          onRemove={removePhoto}
          onSubmit={handleSubmit}
          onTakePhoto={() => setRoute({ name: 'camera' })}
          submitting={submitting}
        />
      );
    } else if (route.name === 'camera') {
      content = <CameraScreen onCapture={() => {
        setSelectedPhotos(prev => [...prev, { id: 'cam-' + Date.now(), uri: window.AD_PHOTOS[2] }]);
        setRoute({ name: 'home' });
      }} onCancel={() => setRoute({ name: 'home' })} />;
    } else if (route.name === 'pickVehicle') {
      title = 'Choose vehicle'; onBack = () => setRoute({ name: 'home' });
      const guess = route.draft?.[0]?.result;
      content = <PickVehicle vehicles={vehicles} aiGuess={guess ? `${guess.vehicle_brand || '—'} ${guess.vehicle_model || ''} ${guess.vehicle_year || ''}` : 'Unknown vehicle'} onPick={handlePickVehicle} onNew={() => handlePickVehicle({ id: 'v' + Date.now(), brand: guess?.vehicle_brand || 'New', model: guess?.vehicle_model || 'Vehicle', year: guess?.vehicle_year, licensePlate: '' })} onCancel={() => setRoute({ name: 'home' })} />;
    } else if (route.name === 'results') {
      const session = sessions.find(s => s.id === route.sessionId);
      const vehicle = vehicles.find(v => v.id === session?.vehicleId);
      title = 'Results'; subtitle = '';
      onBack = () => setRoute({ name: 'home' });
      content = session && vehicle ? (
        <ResultsSummary session={session} vehicle={vehicle}
          onPhotoPress={(idx) => setRoute({ name: 'photoDetail', sessionId: session.id, photoIndex: idx })}
          onAddRepair={() => {}} onEditRepair={() => {}} onDeleteRepair={() => {}} />
      ) : null;
    } else if (route.name === 'photoDetail') {
      const session = sessions.find(s => s.id === route.sessionId);
      const vehicle = vehicles.find(v => v.id === session?.vehicleId);
      const photo = session?.photos[route.photoIndex];
      title = ''; subtitle = vehicle ? `${vehicle.brand} ${vehicle.model}` : '';
      onBack = () => setRoute({ name: 'results', sessionId: session.id });
      content = photo && vehicle ? <ResultDetail photo={photo} vehicle={vehicle} session={session} photoIndex={route.photoIndex} /> : null;
    }
  } else if (tab === 'history') {
    if (route.name === 'home') {
      title = 'History'; subtitle = 'Your vehicles';
      content = <VehicleList vehicles={vehicles} sessions={sessions}
        onPick={(v) => {
          const s = sessions.find(s => s.vehicleId === v.id);
          if (s) setRoute({ name: 'results', sessionId: s.id });
        }}
        onAdd={() => setVehicles(prev => [...prev, { id: 'v'+Date.now(), brand: 'New', model: 'Vehicle', year: 2024, createdAt: new Date().toISOString() }])}
      />;
    } else if (route.name === 'results') {
      const session = sessions.find(s => s.id === route.sessionId);
      const vehicle = vehicles.find(v => v.id === session?.vehicleId);
      title = 'Session';
      onBack = () => setRoute({ name: 'home' });
      content = session && vehicle ? (
        <ResultsSummary session={session} vehicle={vehicle}
          onPhotoPress={(idx) => setRoute({ name: 'photoDetail', sessionId: session.id, photoIndex: idx })}
          onAddRepair={() => {}} onEditRepair={() => {}} onDeleteRepair={() => {}} />
      ) : null;
    } else if (route.name === 'photoDetail') {
      const session = sessions.find(s => s.id === route.sessionId);
      const vehicle = vehicles.find(v => v.id === session?.vehicleId);
      const photo = session?.photos[route.photoIndex];
      title = '';
      onBack = () => setRoute({ name: 'results', sessionId: session.id });
      content = photo && vehicle ? <ResultDetail photo={photo} vehicle={vehicle} session={session} photoIndex={route.photoIndex} /> : null;
    }
  } else if (tab === 'settings') {
    if (route.name === 'home') {
      title = 'Settings';
      content = <Settings
        user={user}
        onSignIn={() => setRoute({ name: 'login' })}
        onSignOut={() => setUser(null)}
        backendUrl={backendUrl} onSaveUrl={(u) => setBackendUrl(u.trim().replace(/\/+$/, ''))}
        connectionStatus={connectionStatus} onCheckConnection={async () => { setConnectionStatus(null); await sleep(500); setConnectionStatus('ok'); }}
        quality={quality} setQuality={setQuality}
        onAddTestSession={() => {}}
        onClearHistory={() => { setSessions([]); setVehicles([]); }}
        dark={dark} onToggleDark={onToggleDark}
      />;
    } else if (route.name === 'login') {
      onBack = () => setRoute({ name: 'home' });
      content = <Login onSubmit={(u) => { setUser(u); setRoute({ name: 'home' }); }} onCancel={() => setRoute({ name: 'home' })} />;
    }
  }

  const handleTabChange = (t) => { setTab(t); setRoute({ name: 'home' }); };
  const showChrome = route.name !== 'camera';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: T.bg }}>
      {showChrome && (
        <AppHeader title={title} subtitle={subtitle} onBack={onBack} right={
          <button onClick={() => onToggleDark(!dark)} title="Toggle theme" style={{
            width: 36, height: 36, borderRadius: 18, border: 0, cursor: 'pointer',
            background: T.surface1, color: T.fg3,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: T.shadow1,
          }}>
            <Icon name={dark ? 'sun' : 'moon'} size={18} color="currentColor" strokeWidth={1.8} />
          </button>
        } />
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {content}
        {submitting && <UploadOverlay phase={submitPhase} current={submitProgress.current} total={submitProgress.total} />}
      </div>
      {showChrome && <TabBar active={tab} onChange={handleTabChange} />}
    </div>
  );
}

window.AD_App = App;
