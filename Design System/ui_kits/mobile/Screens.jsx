/* eslint-disable */
// AutoDamage UI kit — screens
// All visual; the underlying analyze flow / data shape is unchanged.

const T = window.AD_T;

const PHOTOS = [
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=640&q=80',
  'https://images.unsplash.com/photo-1542362567-b07e54358753?w=640&q=80',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=640&q=80',
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=640&q=80',
];

/* ======================================================================== */
/* ANALYZE HOME                                                              */
/* ======================================================================== */
function AnalyzeHome({ photos, onAddSample, onRemove, onSubmit, onTakePhoto, submitting }) {
  const hasPhotos = photos.length > 0;

  return (
    <div style={{ padding: '4px 20px 24px', overflowY: 'auto', flex: 1 }}>

      {/* Hero "scan" CTA tile — the dominant action */}
      <button onClick={onTakePhoto} style={{
        position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 16,
        width: '100%', padding: 20, marginTop: 14,
        borderRadius: 20, border: 0, cursor: 'pointer',
        background: T.scanGrad, color: '#fff', textAlign: 'left',
        boxShadow: '0 14px 32px rgba(37,98,238,0.32), 0 2px 6px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}>
        {/* subtle scanning grid pattern */}
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.18, pointerEvents: 'none' }}>
          <defs>
            <pattern id="ad-scan-grid" width="22" height="22" patternUnits="userSpaceOnUse">
              <path d="M22 0 H0 V22" fill="none" stroke="#fff" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ad-scan-grid)"/>
        </svg>
        <div style={{ position: 'relative', width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto', backdropFilter: 'blur(6px)' }}>
          <Icon name="camera" size={26} color="#fff" strokeWidth={2} />
        </div>
        <div style={{ position: 'relative', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Icon name="sparkles" size={14} color="#fff" strokeWidth={2} />
            <span style={{ fontFamily: T.font, fontSize: 11, fontWeight: 600, letterSpacing: 0.08, textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)' }}>AI Damage Scan</span>
          </div>
          <div style={{ fontFamily: T.font, fontSize: 19, fontWeight: 700, letterSpacing: -0.01, color: '#fff', marginBottom: 4 }}>Take a photo</div>
          <div style={{ fontFamily: T.font, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.45 }}>Capture the damaged area — we'll detect zones, parts and an estimated repair cost.</div>
        </div>
      </button>

      {/* Secondary action */}
      <div style={{ marginTop: 12 }}>
        <SecondaryButton leftIcon="images" onClick={onAddSample}>Choose from Gallery</SecondaryButton>
      </div>

      {/* Selected photos section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 10 }}>
        <div style={{ fontFamily: T.font, fontWeight: 600, fontSize: 15, color: T.fg1 }}>Selected photos</div>
        {hasPhotos && <div style={{ fontFamily: T.font, fontSize: 12, color: T.fg5 }}>{photos.length} {photos.length === 1 ? 'photo' : 'photos'}</div>}
      </div>

      {!hasPhotos ? (
        <EmptyState
          icon="image-outline"
          title="No photos yet"
          body="Add at least one photo of the damaged vehicle to start an analysis."
        />
      ) : (
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {photos.map(p => (
            <div key={p.id} style={{ position: 'relative', flex: '0 0 auto' }}>
              <img src={p.uri} alt="" style={{ width: 92, height: 92, borderRadius: 14, objectFit: 'cover', background: T.surface3, border: `1px solid ${T.hairline}` }} />
              <button onClick={() => onRemove(p.id)} aria-label="Remove" style={{
                position: 'absolute', top: -8, right: -8, width: 26, height: 26, borderRadius: 13,
                background: T.surface1, border: `1px solid ${T.border}`,
                color: T.fg2, cursor: 'pointer', boxShadow: T.shadow2,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
              }}>
                <Icon name="close" size={14} color="currentColor" strokeWidth={2.4} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <PrimaryButton large disabled={!hasPhotos || submitting} onClick={onSubmit} leftIcon={hasPhotos ? 'scan' : null}>
          {submitting ? 'Analyzing…' : hasPhotos ? `Analyze ${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}` : 'Submit / Analyze'}
        </PrimaryButton>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 10 }}>
          <Icon name="shield" size={12} color={T.fg5} strokeWidth={1.8} />
          <span style={{ fontFamily: T.font, fontSize: 11, color: T.fg5 }}>Photos are sent to the MEVA AI service for analysis.</span>
        </div>
      </div>
    </div>
  );
}

/* ======================================================================== */
/* PICK VEHICLE                                                              */
/* ======================================================================== */
function PickVehicle({ vehicles, onPick, onNew, onCancel, aiGuess }) {
  return (
    <div style={{ padding: '4px 20px 24px', overflowY: 'auto', flex: 1 }}>
      <div style={{ marginTop: 14 }}>
        <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 22, color: T.fg1, letterSpacing: -0.01 }}>Choose a vehicle</div>
        <div style={{ fontFamily: T.font, fontSize: 14, color: T.fg4, marginTop: 6, lineHeight: 1.5 }}>
          AI detected: <span style={{ color: T.fg1, fontWeight: 600 }}>{aiGuess}</span>. Assign this session to an existing vehicle or create a new one.
        </div>
      </div>

      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {vehicles.map(v => (
          <Card key={v.id} onClick={() => onPick(v)} padding={14} style={{
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: T.primarySubtle, color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="car" size={22} color="currentColor" strokeWidth={1.8} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.font, fontWeight: 600, fontSize: 15, color: T.fg1 }}>{v.brand} {v.model} <span style={{ color: T.fg4, fontWeight: 500 }}>{v.year}</span></div>
              <div style={{ fontFamily: T.font, fontSize: 12, color: T.fg5, marginTop: 2 }}>{v.licensePlate || 'No plate set'}</div>
            </div>
            <Icon name="chevron-forward" size={18} color={T.fg5} strokeWidth={2} />
          </Card>
        ))}
      </div>

      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PrimaryButton leftIcon="add" onClick={onNew}>New vehicle (pre-fill from AI)</PrimaryButton>
        <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
      </div>
    </div>
  );
}

/* ======================================================================== */
/* RESULTS SUMMARY                                                           */
/* ======================================================================== */
function ResultsSummary({ session, vehicle, onPhotoPress, onAddRepair, onEditRepair, onDeleteRepair }) {
  const dedupedParts = new Map();
  for (const p of session.photos) {
    for (const part of (p.result.affected_parts || [])) {
      const prev = dedupedParts.get(part.name) || 0;
      if (part.estimated_cost > prev) dedupedParts.set(part.name, part.estimated_cost);
    }
  }
  const partsArr = Array.from(dedupedParts.entries());
  const estimate = partsArr.reduce((s, [, c]) => s + c, 0);
  const damages = session.photos.reduce((s, p) => s + (p.result.damage_zones?.length || 0), 0);
  const maxScore = session.photos.reduce((m, p) => Math.max(m, p.result.damage_score), 0);
  const repairs = session.repairs || [];

  return (
    <div style={{ padding: '4px 20px 28px', overflowY: 'auto', flex: 1 }}>

      {/* Vehicle inline strip — replaces the standalone Vehicle card */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 0 6px',
      }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: T.primarySubtle, color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
          <Icon name="car" size={16} color="currentColor" strokeWidth={1.8} />
        </div>
        <div style={{ fontFamily: T.font, fontSize: 13, color: T.fg2, fontWeight: 600 }}>
          {vehicle.brand} {vehicle.model}
          <span style={{ color: T.fg5, fontWeight: 500 }}> · {vehicle.year}{vehicle.licensePlate ? ` · ${vehicle.licensePlate}` : ''}</span>
        </div>
      </div>

      {/* Top summary hero card */}
      <Card padding={20} style={{ marginTop: 8, background: T.surface1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 24, height: 24, borderRadius: 12, background: T.successSoft, color: T.success, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={14} color="currentColor" strokeWidth={2.8} />
          </div>
          <span style={{ fontFamily: T.font, fontSize: 11, fontWeight: 700, color: T.success, letterSpacing: 0.08, textTransform: 'uppercase' }}>Analysis complete</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
          <span style={{ fontFamily: T.font, fontSize: 12, color: T.fg5, fontWeight: 500 }}>Estimated total</span>
        </div>
        <div style={{ fontFamily: T.font, fontWeight: 800, fontSize: 36, color: T.fg1, letterSpacing: -0.02, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          €{estimate.toFixed(0)}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.hairline}` }}>
          <StatBlock label="Photos" value={session.photos.length} />
          <StatBlock label="Damages" value={damages} />
          <StatBlock label="Severity" value={<StatusBadge score={maxScore} />} />
        </div>
      </Card>

      {/* Vehicle card removed — vehicle is shown inline at the top of the screen. */}

      {/* Photos */}
      <SectionHeader title="Photos" action={<LinkButton><Icon name="add" size={16} color="currentColor" strokeWidth={2.4}/>Add</LinkButton>} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {session.photos.map((p, idx) => (
          <PhotoResultCard key={idx} photo={p} index={idx + 1} onClick={() => onPhotoPress(idx)} />
        ))}
      </div>

      {/* Affected parts / estimate */}
      {partsArr.length > 0 && (
        <>
          <SectionHeader title="Affected parts" hint="Deduplicated across photos" />
          <Card padding={'4px 16px 14px'}>
            {partsArr.map(([name, cost]) => (
              <EstimateLineItem key={name} label={name} value={`€${cost.toFixed(0)}`} />
            ))}
            <EstimateLineItem total label="Total estimate" value={`€${estimate.toFixed(0)}`} />
          </Card>
        </>
      )}

      {/* Repair log */}
      <SectionHeader title="Repair log" action={<LinkButton onClick={onAddRepair}><Icon name="add" size={16} color="currentColor" strokeWidth={2.4}/>Add repair</LinkButton>} />
      {repairs.length === 0 ? (
        <EmptyState icon="shield" title="No repairs logged" body="Track what has been fixed and how much it cost." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {repairs.map(r => <RepairCard key={r.id} repair={r} onEdit={() => onEditRepair(r.id)} onDelete={() => onDeleteRepair(r.id)} />)}
        </div>
      )}
    </div>
  );
}

function StatBlock({ label, value }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: T.font, fontSize: 10, fontWeight: 600, color: T.fg5, textTransform: 'uppercase', letterSpacing: 0.06, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 16, color: T.fg1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

function SectionHeader({ title, hint, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 }}>
      <div>
        <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 11, color: T.fg5, letterSpacing: 0.08, textTransform: 'uppercase' }}>{title}</div>
        {hint && <div style={{ fontFamily: T.font, fontSize: 12, color: T.fg5, marginTop: 2 }}>{hint}</div>}
      </div>
      {action}
    </div>
  );
}

function PhotoResultCard({ photo, index, onClick }) {
  const r = photo.result;
  const zones = r.damage_zones?.length || 0;
  const parts = r.affected_parts?.length || 0;
  return (
    <Card onClick={onClick} padding={12} style={{
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{ position: 'relative', flex: '0 0 auto' }}>
        <img src={photo.localUri} alt="" style={{ width: 76, height: 76, borderRadius: 12, objectFit: 'cover', background: T.surface3, display: 'block' }} />
        <div style={{
          position: 'absolute', bottom: 6, left: 6,
          padding: '2px 8px', borderRadius: 999,
          background: 'rgba(0,0,0,0.7)', color: '#fff',
          fontFamily: T.font, fontWeight: 700, fontSize: 11,
          fontVariantNumeric: 'tabular-nums', backdropFilter: 'blur(4px)',
        }}>
          {Math.round(r.damage_score * 100)}%
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ fontFamily: T.font, fontWeight: 600, fontSize: 15, color: T.fg1 }}>Photo {index}</div>
          <StatusBadge score={r.damage_score} />
        </div>
        <div style={{ fontFamily: T.font, fontSize: 12, color: T.fg4 }}>
          {zones} {zones === 1 ? 'zone' : 'zones'} · {parts} {parts === 1 ? 'part' : 'parts'}
          {typeof r.total_estimated_cost === 'number' && ` · €${r.total_estimated_cost.toFixed(0)}`}
        </div>
      </div>
      <Icon name="chevron-forward" size={18} color={T.fg5} strokeWidth={2} />
    </Card>
  );
}

function RepairCard({ repair, onEdit, onDelete }) {
  return (
    <Card padding={14}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.font, fontWeight: 600, fontSize: 15, color: T.fg1 }}>{repair.performedBy || 'Repair'}</div>
          <div style={{ fontFamily: T.font, fontSize: 12, color: T.fg5, marginTop: 2 }}>{repair.performedAt}</div>
          {repair.workDescription && <div style={{ fontFamily: T.font, fontSize: 13, color: T.fg3, marginTop: 10, lineHeight: 1.5 }}>{repair.workDescription}</div>}
        </div>
        {typeof repair.actualCost === 'number' && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: T.font, fontSize: 10, color: T.fg5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.06 }}>Spent</div>
            <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 18, color: T.success, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>€{repair.actualCost.toFixed(0)}</div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.hairline}` }}>
        <LinkButton onClick={onEdit}>Edit</LinkButton>
        <LinkButton onClick={onDelete} style={{ color: T.severe }}>Delete</LinkButton>
      </div>
    </Card>
  );
}

/* ======================================================================== */
/* RESULT DETAIL                                                             */
/* ======================================================================== */
function ResultDetail({ photo, vehicle, session, photoIndex = 0 }) {
  const r = photo.result;
  const scorePct = Math.round(r.damage_score * 100);
  const zones = r.damage_zones || [];
  const parts = r.affected_parts || [];
  const total = typeof r.total_estimated_cost === 'number' ? r.total_estimated_cost : null;

  return (
    <div style={{ padding: '4px 20px 28px', overflowY: 'auto', flex: 1 }}>
      {/* Photo heading + analyzed date — replaces the Vehicle card */}
      <div style={{ marginTop: 12, marginBottom: 10 }}>
        <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 22, color: T.fg1, letterSpacing: -0.01 }}>Photo {photoIndex + 1}</div>
        <div style={{ fontFamily: T.font, fontSize: 13, color: T.fg5, marginTop: 4 }}>Analyzed {session.createdAt}</div>
      </div>

      {/* Hero image with overlay severity */}
      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.hairline}`, boxShadow: T.shadow2 }}>
        <img src={photo.localUri} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block', background: T.surface3 }} />
        <div style={{
          position: 'absolute', top: 12, left: 12,
          padding: '6px 12px', borderRadius: 999,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: scoreColor(r.damage_score) }}/>
          <span style={{ fontFamily: T.font, fontSize: 12, color: '#fff', fontWeight: 600 }}>{severityLabel(r.damage_score)}</span>
        </div>
        <div style={{
          position: 'absolute', top: 12, right: 12,
          padding: '6px 12px', borderRadius: 999,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
        }}>
          <span style={{ fontFamily: T.font, fontSize: 13, color: '#fff', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{scorePct}%</span>
        </div>
      </div>

      {/* Vehicle card removed — vehicle context is shown in the screen header subtitle. */}

      {/* Detected damage */}
      <SectionHeader title="Detected damage" />
      <Card padding={'4px 16px'}>
        {zones.length === 0 ? (
          <div style={{ padding: '14px 0', color: T.fg5, fontStyle: 'italic', fontFamily: T.font }}>No zones detected.</div>
        ) : zones.map((z, i) => (
          <DataRow key={i} k={z.label} v={`${Math.round(z.confidence * 100)}%`} mono last={i === zones.length - 1} />
        ))}
      </Card>

      {/* Affected parts */}
      <SectionHeader title="Affected parts" />
      <Card padding={'4px 16px 14px'}>
        {parts.length === 0 ? (
          <div style={{ padding: '14px 0', color: T.fg5, fontStyle: 'italic', fontFamily: T.font }}>—</div>
        ) : parts.map((p, i) => (
          <EstimateLineItem key={i} label={p.name} value={typeof p.estimated_cost === 'number' ? `€${p.estimated_cost.toFixed(0)}` : '—'} />
        ))}
        {total !== null && <EstimateLineItem total label="Total (this photo)" value={`€${total.toFixed(0)}`} />}
      </Card>

      {/* Recommendation */}
      <SectionHeader title="Recommendation" />
      <Card padding={16} style={{ background: T.primarySubtle, border: `1px solid ${T.primary}33` }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: T.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
            <Icon name="sparkles" size={18} color="#fff" strokeWidth={2} />
          </div>
          <div style={{ fontFamily: T.font, fontSize: 14, color: T.fg1, lineHeight: 1.55 }}>
            {r.repair_recommendation || '—'}
          </div>
        </div>
      </Card>
    </div>
  );
}

function DataRow({ k, v, mono, last }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 0',
      borderBottom: last ? 0 : `1px solid ${T.hairline}`,
    }}>
      <span style={{ fontFamily: T.font, fontSize: 13, color: T.fg5, fontWeight: 500 }}>{k}</span>
      <span style={{
        fontFamily: T.font, fontSize: 14, color: T.fg1, fontWeight: 600,
        fontVariantNumeric: mono ? 'tabular-nums' : 'normal',
      }}>{v}</span>
    </div>
  );
}

/* ======================================================================== */
/* VEHICLE LIST                                                              */
/* ======================================================================== */
function VehicleList({ vehicles, sessions, onPick, onAdd }) {
  return (
    <div style={{ position: 'relative', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '4px 20px 100px', overflowY: 'auto', flex: 1 }}>
        {vehicles.length === 0 ? (
          <div style={{ paddingTop: 60 }}>
            <EmptyState
              icon="car" title="No vehicles yet"
              body="Take a photo from Analyze to start, or add a vehicle manually."
              action={<PrimaryButton leftIcon="add" onClick={onAdd} style={{ width: 'auto', padding: '10px 18px', marginTop: 6 }}>Add vehicle</PrimaryButton>}
            />
          </div>
        ) : (
          <>
            <SectionHeader title={`${vehicles.length} ${vehicles.length === 1 ? 'vehicle' : 'vehicles'}`} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {vehicles.map(v => {
                const matching = sessions.filter(s => s.vehicleId === v.id);
                const repairs = matching.reduce((sum, s) => sum + (s.repairs?.length || 0), 0);
                const lastSession = matching[0];
                const maxScore = matching.reduce((m, s) => Math.max(m, ...s.photos.map(p => p.result.damage_score)), 0);
                return (
                  <Card key={v.id} onClick={() => onPick(v)} padding={14} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: T.primarySubtle, color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="car" size={22} color="currentColor" strokeWidth={1.8} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontFamily: T.font, fontWeight: 600, fontSize: 15, color: T.fg1 }}>{v.brand} {v.model}</div>
                        {maxScore > 0 && <StatusBadge score={maxScore} />}
                      </div>
                      <div style={{ fontFamily: T.font, fontSize: 12, color: T.fg5, marginTop: 4 }}>
                        {v.year} · {v.licensePlate || 'No plate'}
                      </div>
                      <div style={{ fontFamily: T.font, fontSize: 12, color: T.fg4, marginTop: 4 }}>
                        {matching.length} {matching.length === 1 ? 'session' : 'sessions'}{repairs > 0 ? ` · ${repairs} repaired` : ''}
                      </div>
                    </div>
                    <Icon name="chevron-forward" size={18} color={T.fg5} strokeWidth={2} />
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
      {vehicles.length > 0 && (
        <button onClick={onAdd} aria-label="Add vehicle" style={{
          position: 'absolute', right: 20, bottom: 20,
          width: 56, height: 56, borderRadius: 28,
          background: T.primary, color: '#fff', border: 0, cursor: 'pointer',
          boxShadow: '0 10px 24px rgba(37,98,238,0.35), 0 2px 6px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="add" size={26} color="#fff" strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
}

/* ======================================================================== */
/* SETTINGS                                                                  */
/* ======================================================================== */
function Settings({ user, onSignIn, onSignOut, backendUrl, onSaveUrl, connectionStatus, onCheckConnection, quality, setQuality, onAddTestSession, onClearHistory, dark, onToggleDark }) {
  const [urlInput, setUrlInput] = React.useState(backendUrl);
  const dirty = urlInput.trim().replace(/\/+$/, '') !== backendUrl;
  return (
    <div style={{ padding: '4px 20px 28px', overflowY: 'auto', flex: 1 }}>
      <div style={{ marginTop: 14, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
        <BrandStamp />
      </div>

      <SectionHeader title="Account" />
      <Card padding={16}>
        {user ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 22, background: T.scanGrad, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.font, fontWeight: 700, fontSize: 16 }}>
                {(user.name || user.email || 'U')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.font, fontWeight: 600, fontSize: 15, color: T.fg1 }}>{user.name}</div>
                <div style={{ fontFamily: T.font, fontSize: 12, color: T.fg5, marginTop: 2 }}>{user.email}</div>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <DangerButton onClick={onSignOut}>Sign out</DangerButton>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: T.font, fontSize: 14, color: T.fg3 }}>You are not signed in.</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <PrimaryButton onClick={onSignIn}>Sign in</PrimaryButton>
              <SecondaryButton>Register</SecondaryButton>
            </div>
          </>
        )}
      </Card>

      <SectionHeader title="Appearance" />
      <Card padding={'4px 16px 14px'}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0' }}>
          <div>
            <div style={{ fontFamily: T.font, fontWeight: 600, fontSize: 14, color: T.fg1 }}>Theme</div>
            <div style={{ fontFamily: T.font, fontSize: 12, color: T.fg5, marginTop: 2 }}>Switch between light and dark mode</div>
          </div>
          <div style={{ width: 200 }}>
            <Segmented options={[{value:false,label:'Light'},{value:true,label:'Dark'}]} value={dark} onChange={onToggleDark} />
          </div>
        </div>
      </Card>

      <SectionHeader title="Backend" />
      <Card padding={16}>
        <Field label="Backend URL">
          <Input value={urlInput} onChange={e => setUrlInput(e.target.value)} />
        </Field>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, marginTop: -4 }}>
          {connectionStatus === 'ok' && (
            <><span style={{ width: 8, height: 8, borderRadius: 4, background: T.success }}/><span style={{ fontFamily: T.font, fontSize: 12, color: T.success, fontWeight: 600 }}>Connected</span></>
          )}
          {connectionStatus === 'failed' && (
            <><span style={{ width: 8, height: 8, borderRadius: 4, background: T.severe }}/><span style={{ fontFamily: T.font, fontSize: 12, color: T.severe, fontWeight: 600 }}>Connection failed</span></>
          )}
          {!connectionStatus && (
            <><span style={{ width: 8, height: 8, borderRadius: 4, background: T.fg5 }}/><span style={{ fontFamily: T.font, fontSize: 12, color: T.fg5 }}>Not tested</span></>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <PrimaryButton disabled={!dirty} onClick={() => onSaveUrl(urlInput)}>Save</PrimaryButton>
          <SecondaryButton onClick={onCheckConnection}>Check</SecondaryButton>
        </div>
      </Card>

      <SectionHeader title="Capture quality" hint="Lower quality uploads faster on poor networks" />
      <Card padding={'14px 16px'}>
        <Segmented
          options={[{value:'low',label:'Low'},{value:'medium',label:'Medium'},{value:'high',label:'High'}]}
          value={quality} onChange={setQuality}
        />
      </Card>

      <SectionHeader title="Developer" />
      <Card padding={'4px 16px 16px'}>
        <DataRow k="App version" v="Sprint 3 demo" />
        <DataRow k="Runtime" v="React Native + Expo" last />
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <SecondaryButton onClick={onAddTestSession}>Add test session</SecondaryButton>
          <DangerButton onClick={onClearHistory}>Clear data</DangerButton>
        </div>
      </Card>
    </div>
  );
}

/* ======================================================================== */
/* LOGIN                                                                     */
/* ======================================================================== */
function Login({ onSubmit, onCancel }) {
  const [email, setEmail] = React.useState('alex@example.com');
  const [password, setPassword] = React.useState('••••••');
  return (
    <div style={{ padding: '20px 24px 24px', overflowY: 'auto', flex: 1 }}>
      <BrandStamp size={36} />
      <div style={{ marginTop: 28 }}>
        <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 24, color: T.fg1, letterSpacing: -0.015 }}>Welcome back</div>
        <div style={{ fontFamily: T.font, fontSize: 14, color: T.fg4, marginTop: 6 }}>Sign in to sync your vehicles and analyses.</div>
      </div>
      <div style={{ marginTop: 22 }}>
        <Field label="Email"><Input value={email} onChange={e => setEmail(e.target.value)} /></Field>
        <Field label="Password"><Input value={password} type="password" onChange={e => setPassword(e.target.value)} /></Field>
      </div>
      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PrimaryButton large onClick={() => onSubmit({ email, name: email.split('@')[0] })}>Sign in</PrimaryButton>
        <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
      </div>
      <div style={{ marginTop: 20, textAlign: 'center', fontFamily: T.font, fontSize: 13, color: T.fg4 }}>
        Don't have an account? <span style={{ color: T.primary, fontWeight: 600 }}>Register</span>
      </div>
    </div>
  );
}

/* ======================================================================== */
/* CAMERA                                                                    */
/* ======================================================================== */
function CameraScreen({ onCapture, onCancel }) {
  return (
    <div style={{ flex: 1, background: '#000', position: 'relative', overflow: 'hidden' }}>
      <img src="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=640&q=80" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />

      {/* scan reticle */}
      <div style={{ position: 'absolute', inset: 80, border: '1.5px solid rgba(255,255,255,0.55)', borderRadius: 16 }}>
        <div style={{ position: 'absolute', top: -1, left: -1, width: 20, height: 20, borderTop: '3px solid #3b7bff', borderLeft: '3px solid #3b7bff', borderRadius: '8px 0 0 0' }}/>
        <div style={{ position: 'absolute', top: -1, right: -1, width: 20, height: 20, borderTop: '3px solid #3b7bff', borderRight: '3px solid #3b7bff', borderRadius: '0 8px 0 0' }}/>
        <div style={{ position: 'absolute', bottom: -1, left: -1, width: 20, height: 20, borderBottom: '3px solid #3b7bff', borderLeft: '3px solid #3b7bff', borderRadius: '0 0 0 8px' }}/>
        <div style={{ position: 'absolute', bottom: -1, right: -1, width: 20, height: 20, borderBottom: '3px solid #3b7bff', borderRight: '3px solid #3b7bff', borderRadius: '0 0 8px 0' }}/>
      </div>

      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onCancel} style={{ width: 40, height: 40, borderRadius: 20, border: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="close" size={20} color="#fff" strokeWidth={2.2} />
        </button>
        <div style={{ padding: '6px 12px', borderRadius: 999, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="sparkles" size={14} color="#3b7bff" strokeWidth={2} />
          <span style={{ fontFamily: T.font, fontWeight: 600, fontSize: 12, color: '#fff' }}>AI Scan</span>
        </div>
        <button style={{ width: 40, height: 40, borderRadius: 20, border: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="camera-reverse" size={20} color="#fff" strokeWidth={2} />
        </button>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ fontFamily: T.font, fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Center the damaged area inside the frame</div>
        <button onClick={onCapture} aria-label="Capture" style={{
          width: 76, height: 76, borderRadius: 38, border: '4px solid #fff', background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <div style={{ width: 58, height: 58, borderRadius: 29, background: '#fff' }} />
        </button>
      </div>
    </div>
  );
}

/* ======================================================================== */
/* UPLOAD OVERLAY                                                            */
/* ======================================================================== */
function UploadOverlay({ phase, current, total }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: T.scrim, backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <Card padding={22} elevated style={{
        minWidth: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        background: T.surface1, boxShadow: T.shadowPop,
      }}>
        <div style={{ position: 'relative', width: 56, height: 56 }}>
          <svg width="56" height="56" viewBox="0 0 56 56" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
            <circle cx="28" cy="28" r="24" stroke={T.surface3} strokeWidth="4" fill="none"/>
            <circle cx="28" cy="28" r="24" stroke={T.primary} strokeWidth="4" fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 24}`}
              strokeDashoffset={`${2 * Math.PI * 24 * (1 - (total ? current / total : 0.3))}`}
              style={{ transition: 'stroke-dashoffset 300ms ease' }}/>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.font, fontWeight: 700, fontSize: 12, color: T.primary }}>
            {phase === 'uploading' ? `${current}/${total}` : '...'}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: T.font, fontWeight: 600, fontSize: 14, color: T.fg1 }}>
            {phase === 'validating' ? 'Validating photos…' : 'Uploading to MEVA AI'}
          </div>
          <div style={{ fontFamily: T.font, fontSize: 12, color: T.fg5, marginTop: 2 }}>
            {phase === 'validating' ? 'Checking size and resolution' : 'Running damage detection model'}
          </div>
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, {
  AD_PHOTOS: PHOTOS,
  AnalyzeHome, PickVehicle, ResultsSummary, ResultDetail, VehicleList, Settings, Login, CameraScreen, UploadOverlay,
});
