'use strict';

const APP_VERSION = '3.5.5';
const APP_NAME = 'Tiger';
const STORAGE_KEY = 'tiger_training_clean_v3_5_2';
const LEGACY_STORAGE_KEYS = [
  'tiger_training_clean_v3_5_1',
  'tiger_training_clean_v3_5',
  'tiger_training_clean_v3_4',
  'tiger_training_clean_v3_3',
  'tiger_training_clean_v3_2',
  'tiger_training_clean_v3_1',
  'tiger_training_clean_v3_0',
  'tiger_training_clean_v2_9',
  'tiger_training_clean_v2_8',
  'tiger_training_clean_v2_7',
  'tiger_training_clean_v2_6',
  'tiger_training_clean_v2_5',
  'tiger_training_clean_v2_4',
  'tiger_training_clean_v2_3',
  'tiger_training_clean_v2_2',
  'tiger_training_clean_v2_1',
  ...Array.from({ length: 55 }, (_, i) => `tiger_training_v1_${55 - i}`),
  ...Array.from({ length: 47 }, (_, i) => `dragon_training_v1_${48 - i}`),
  'forgefit_base_v1_1',
  'forgefit_base_v1'
];
const SETTINGS_KEY = 'tiger_settings_clean_v3_5_2';
const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const DAY_LABELS = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday' };
const STRENGTH_DAYS = ['tuesday', 'thursday', 'friday'];
const CARDIO_DAYS = ['monday', 'wednesday'];
const CYCLE_LABELS = { A: 'Week 1', B: 'Week 2' };
const KG_PLATE_SIZES = [1.25, 2.5, 5, 10, 15, 20, 25];


// Optional, user-approved advanced skill progressions. Exercise IDs stay stable so history remains continuous.
const SKILL_PROGRESSIONS = {
  'dragon-flag-eccentrics': {
    label: 'Dragon Flag', requiredSessions: 3, minSets: 3, minValue: 5, valueType: 'reps', maxRpe: 8,
    qualityStandard: 'Every lower lasted 5–8 seconds with a rigid body and controlled range.',
    upgraded: {
      name: 'Dragon Flags', sets: 3, reps: '1–4', target: 'Strict full repetitions',
      purpose: 'Advanced whole-body anti-extension strength for calisthenics',
      notes: 'Use only a range you can reverse without hip collapse. Stop before form breaks; finish with an eccentric if needed.',
      formCue: 'Anchor the shoulders, keep the body rigid and move as one unit without folding at the hips.'
    }
  },
  'standing-rollout-progression': {
    label: 'Standing Roll-out', requiredSessions: 3, minSets: 3, minValue: 5, valueType: 'reps', maxRpe: 8,
    qualityStandard: 'Every repetition returned under control with ribs down and no lower-back sag.',
    upgraded: {
      name: 'Full Standing Roll-outs', sets: 3, reps: '1–5', target: 'Standing to full extension and back',
      purpose: 'Elite anti-extension strength and complete standing ab-wheel control',
      notes: 'Use full extension only while the trunk stays braced. Shorten the range immediately if the hips or lower back lose position.',
      formCue: 'Brace before moving, reach as one unit and pull back without sitting the hips first.'
    }
  },
  'hanging-leg-raises': {
    label: 'Weighted Hanging Leg Raise', requiredSessions: 3, minSets: 4, minValue: 8, valueType: 'reps', maxRpe: 8,
    qualityStandard: 'All repetitions were straight-leg, swing-free and lowered under control.',
    upgraded: {
      name: 'Weighted Hanging Leg Raises', sets: 4, reps: '5–8', target: 'Light ankle or dumbbell load with strict control',
      purpose: 'Advanced hanging compression strength and grip endurance',
      notes: 'Begin with the smallest practical load. Start from stillness, avoid momentum and lower slowly.',
      formCue: 'Start still, keep the legs long and raise without swinging; lower the added load slowly.'
    }
  },
  'l-sit-hold': {
    label: 'Full L-sit', requiredSessions: 3, minSets: 4, minValue: 20, valueType: 'duration', maxRpe: 8,
    qualityStandard: 'All holds used locked elbows, depressed shoulders and the hardest clean progression for at least 20 seconds.',
    upgraded: {
      name: 'Full L-sit Holds', sets: 4, reps: '10–30 sec', target: 'Both legs straight and clear of the floor',
      purpose: 'Advanced calisthenics compression, hip-flexor and straight-arm strength',
      notes: 'Use a full L-sit while form is clean. Regress briefly to one-leg or tuck only to complete controlled volume.',
      formCue: 'Press the shoulders down, lock the elbows and keep both legs straight without swinging.'
    }
  }
};

const DURATION_SET_EXERCISE_IDS = new Set(['farmers-walks', 'kettlebell-walks', 'suitcase-carries', 'hollow-body-hold', 'l-sit-hold', 'long-lever-plank', 'air-bike-intervals', 'battle-rope-intervals', 'sled-push-finisher']);
const BODYWEIGHT_ADDED_IDS = new Set(['weighted-pullups', 'weighted-dips']);
const EQUIPMENT_REMINDER_IDS = {
  gloves: new Set(['weighted-pullups', 'weighted-dips', 'farmers-walks', 'kettlebell-walks', 'suitcase-carries']),
  watch: new Set(['farmers-walks', 'kettlebell-walks', 'suitcase-carries']),
  band: new Set(['hip-abduction', 'hip-abduction-or-tibialis'])
};
function isDurationSetExercise(id) { return DURATION_SET_EXERCISE_IDS.has(id); }
function exerciseTextForEquipment(ex) {
  return `${ex?.id || ''} ${ex?.name || ''} ${ex?.category || ''}`.toLowerCase();
}
function dayEquipmentItemsForExercises(exercises = []) {
  const needs = { gloves: false, watch: false, band: false };
  exercises.forEach(ex => {
    const text = exerciseTextForEquipment(ex);
    if (
      EQUIPMENT_REMINDER_IDS.gloves.has(ex?.id) ||
      text.includes('pull-up') ||
      text.includes('pullups') ||
      text.includes('dips') ||
      text.includes('farmer') ||
      text.includes('kettlebell walk') ||
      text.includes('suitcase carr')
    ) needs.gloves = true;
    if (
      EQUIPMENT_REMINDER_IDS.watch.has(ex?.id) ||
      text.includes('farmer') ||
      text.includes('kettlebell walk') ||
      text.includes('suitcase carr')
    ) needs.watch = true;
    if (
      EQUIPMENT_REMINDER_IDS.band.has(ex?.id) ||
      text.includes('lateral walk')
    ) needs.band = true;
  });
  const items = [];
  if (needs.watch) items.push('watch');
  if (needs.gloves) items.push('gym gloves');
  if (needs.band) items.push('resistance band');
  return items;
}
function joinEquipmentItems(items = []) {
  if (!items.length) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}
function renderDayEquipmentReminder(exercises = []) {
  const items = dayEquipmentItemsForExercises(exercises);
  if (!items.length) return '';
  return `<div class="day-equipment-reminder"><span>Bring ${esc(joinEquipmentItems(items))}.</span></div>`;
}
function equipmentReminderForExercise() { return ''; }
function bodyweightAddedLabel(ex) {
  if (ex?.id === 'weighted-pullups') return 'Vest weight';
  if (ex?.id === 'weighted-dips') return 'Added weight';
  return 'Added weight';
}
function bodyweightAddedModeLabel(ex) {
  if (ex?.id === 'weighted-pullups') return 'Bodyweight + vest';
  if (ex?.id === 'weighted-dips') return 'Bodyweight + added';
  return 'Bodyweight + added';
}
function normaliseExerciseV148(ex) {
  if (!ex) return [];
  if (ex.id === 'rollouts' || ex.id === 'paused-rollouts') {
    return [
      { ...ex, id: 'standing-rollout-progression', name: 'Standing Roll-out Progression', sets: 2, reps: '3–6', target: 'Controlled standing range', purpose: 'Build toward a full standing-to-extension roll-out', notes: 'Use a wall, raised bar, ramp or shortened floor range. Reach only as far as you can return without hip collapse or lower-back sagging.' },
      { ...ex, id: 'kneeling-rollouts', name: 'Full-range Kneeling Roll-outs', sets: 2, reps: '6–12', target: 'Full controlled extension', purpose: 'Build the strength reserve needed for standing roll-outs', notes: 'Reach long with ribs down, pause briefly at full extension, then pull back under control.' }
    ];
  }
  if (ex.id === 'weighted-dips') return [{ ...ex, name: 'Dips' }];
  if (isDurationSetExercise(ex.id)) {
    const defaultDuration = ex.id === 'suitcase-carries' ? '20–60 sec each side' : (ex.reps && String(ex.reps).includes('sec') ? ex.reps : (ex.target && String(ex.target).includes('sec') ? ex.target : '20–60 sec'));
    return [{ ...ex, reps: defaultDuration, target: ex.target || 'Duration carry' }];
  }
  return [{ ...ex }];
}
function normaliseWorkoutV148(workout) {
  if (!workout || !Array.isArray(workout.exercises)) return workout;
  return { ...workout, exercises: workout.exercises.flatMap(normaliseExerciseV148) };
}
function renderSetTargetChip(ex) {
  const label = isDurationSetExercise(ex.id) ? 'Target duration' : 'Target reps';
  return `<div class="set-target-once"><span class="chip">${label}: ${esc(ex.reps)}</span></div>`;
}
function renderStrengthSetTable(ex, visibleSets, draft) {
  const isDuration = isDurationSetExercise(ex.id);
  const label = isDuration ? 'Duration' : 'Reps';
  const inputName = isDuration ? 'duration' : 'reps';
  const step = isDuration ? 'any' : '1';
  const mode = isDuration ? 'decimal' : 'numeric';
  const placeholder = isDuration ? 'seconds' : '';
  return `<table class="log-table compact-set-table reps-only-set-table" aria-label="Log ${label.toLowerCase()} for ${esc(ex.name)}">
      <thead><tr><th>Set</th><th>${label}</th></tr></thead>
      <tbody>
        ${Array.from({ length: visibleSets }, (_, i) => `<tr class="work-set-row">
          <td data-label="Set">${i + 1}</td>
          <td data-label="${label}"><input type="number" step="${step}" min="0" name="${inputName}" inputmode="${mode}" placeholder="${placeholder}" value="${esc(draftSetValue(draft, ex.id, i, inputName))}"><input type="checkbox" name="done" class="hidden-done-input" aria-hidden="true" tabindex="-1" ${draftSetValue(draft, ex.id, i, 'done') ? 'checked' : ''}></td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}
function parseRepTargetRange(ex) {
  if (!ex || isDurationSetExercise(ex.id)) return null;
  const raw = String(ex.reps || '');
  const nums = raw.match(/\d+(?:\.\d+)?/g)?.map(Number).filter(Number.isFinite) || [];
  if (!nums.length) return null;
  if (nums.length === 1) return { min: nums[0], max: nums[0] };
  return { min: Math.min(nums[0], nums[1]), max: Math.max(nums[0], nums[1]) };
}
function loadCoachStep() { return state.settings.weightUnit === 'lb' ? 1 : 0.5; }
function coachRoundLoad(value) {
  const step = loadCoachStep();
  return formatWeight(Math.max(step, Math.round((Number(value) || 0) / step) * step));
}
function coachSuggestionForEntry(entry, ex) {
  if (!entry || entry.type !== 'strength' || isDurationSetExercise(entry.exerciseId)) return null;
  const range = parseRepTargetRange(ex);
  if (!range) return null;
  const sets = strengthSets(entry);
  if (!sets.length) return null;
  const reps = sets.map(set => Number(set.reps)).filter(Number.isFinite);
  const avgReps = avg(reps);
  const allAtOrAboveTop = reps.length && reps.every(r => r >= range.max);
  const firstWeight = Number(sets.find(set => Number.isFinite(Number(set.addedWeight || set.weight)))?.addedWeight || sets.find(set => Number.isFinite(Number(set.weight)))?.weight || 0);
  if (!Number.isFinite(firstWeight) || firstWeight <= 0) return null;
  if (avgReps < range.min * 0.6) {
    const next = coachRoundLoad(firstWeight * 0.85);
    return { action: 'reduce', nextWeight: next, message: `Try ${next} ${state.settings.weightUnit} next time.` };
  }
  if (avgReps < range.min) {
    const next = coachRoundLoad(firstWeight * 0.9);
    return { action: 'reduce', nextWeight: next, message: `Try ${next} ${state.settings.weightUnit} next time.` };
  }
  if (allAtOrAboveTop) {
    const next = coachRoundLoad(firstWeight * 1.05);
    return { action: 'increase', nextWeight: next, message: `Consider ${next} ${state.settings.weightUnit} next time.` };
  }
  return { action: 'hold', nextWeight: formatWeight(firstWeight), message: `Keep ${formatWeight(firstWeight)} ${state.settings.weightUnit} next time.` };
}
function updateLoadCoachFromSession(session, workout) {
  if (!session || !workout) return;
  const byId = new Map((workout.exercises || []).map(ex => [ex.id, ex]));
  session.entries?.forEach(entry => {
    const ex = byId.get(entry.exerciseId);
    const suggestion = coachSuggestionForEntry(entry, ex);
    if (!suggestion) return;
    const meta = getExerciseMeta(entry.exerciseId);
    meta.coachSuggestion = { ...suggestion, date: session.date, sessionId: session.id };
    if (suggestion.nextWeight && suggestion.action === 'reduce') meta.manualWeight = suggestion.nextWeight;
  });
}
function renderLoadCoach(meta) {
  const msg = meta?.coachSuggestion?.message;
  return msg ? `<div class="coach-suggestion"><strong>Next</strong><span>${esc(msg)}</span></div>` : '';
}


const DAILY_STRETCHES = {
  monday: [
    { name: 'Standing calf stretch', cue: 'Hands on wall, back leg straight, heel down.' },
    { name: 'Hamstring stretch', cue: 'Standing or seated; keep it gentle and controlled.' }
  ],
  tuesday: [
    { name: 'Standing chest stretch', cue: 'Clasp hands behind back, lift chest, and gently draw shoulders back.' },
    { name: 'Standing quad stretch', cue: 'Hold wall for balance, knees close, gentle pull.' }
  ],
  wednesday: [
    { name: 'Standing calf stretch', cue: 'Hands on wall, back leg straight, heel down.' },
    { name: 'Hip flexor stretch', cue: 'Kneeling if comfortable, or standing lunge version.' }
  ],
  thursday: [
    { name: 'Prostrate bow stretch', cue: 'Reach arms forward, sit hips back, relax lats and upper back.' },
    { name: 'Hamstring stretch', cue: 'Standing or seated; keep it gentle and controlled.' }
  ],
  friday: [
    { name: 'Cross-body shoulder stretch', cue: 'Pull arm across chest without shrugging.' },
    { name: 'Piriformis stretch', cue: 'Seated or lying figure-four position; gentle pull only.' }
  ]
};


const REST_RULES = {
  mainStrength: ['bench-smith-press', 'smith-squat', 'leg-press', 'weighted-pullups', 'trap-bar-deadlift', 'shoulder-press-machine', 'db-shoulder-press'],
  secondaryCompound: ['incline-press', 'decline-press', 'weighted-dips', 'barbell-row', 'cable-row', 'one-arm-db-row', 'bulgarian-split-squat', 'reverse-lunges', 'single-leg-rdl', 'seated-leg-curl', 'farmers-walks', 'suitcase-carries', 'kettlebell-walks', 'kettlebell-swings'],
  coreAndAccessory: ['rollouts', 'standing-rollout-progression', 'standing-rollouts', 'kneeling-rollouts', 'paused-rollouts', 'hollow-body-hold', 'long-lever-plank', 'l-sit-hold', 'hanging-leg-raises', 'weighted-hanging-leg-raises', 'dragon-flag-eccentrics', 'pallof-press', 'db-curls', 'standing-calf-raises'],
  prehabLight: ['rope-pulldown', 'french-press', 'flyes', 'face-pulls', 'external-rotations', 'reverse-flyes', 'lateral-raises', 'hip-abduction', 'tibialis-raises', 'hip-abduction-or-tibialis', 'air-bike-intervals', 'battle-rope-intervals', 'sled-push-finisher']
};

const SUBSTITUTIONS = {
  'bench-smith-press': [
    { id: 'db-bench-press', name: 'Dumbbell Bench Press', category: 'Chest + Triceps', notes: 'Equipment swap for bench/Smith press. Keep shoulders set and use a load you can control.' },
    { id: 'press-ups', name: 'Press-ups', category: 'Chest + Triceps', notes: 'Bodyweight swap. Use strict range and stop before form collapses.' }
  ],
  'smith-squat': [
    { id: 'leg-press', name: 'Leg Press', category: 'Quads + Glutes', notes: 'Swap if the Smith machine is busy. Control depth and avoid aggressive knee lockout.' },
    { id: 'goblet-squat', name: 'Goblet Squat', category: 'Quads + Glutes', notes: 'Simple controlled squat swap. Keep torso braced and reps clean.' }
  ],
  'leg-press': [
    { id: 'smith-squat', name: 'Smith Squat', category: 'Quads + Glutes', notes: 'Swap if the leg press is busy. Warm up and keep the movement vertical.' },
    { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', category: 'Quads + Glutes', notes: 'Single-leg swap. Use a lighter load than bilateral leg work.' }
  ],
  'incline-press': [
    { id: 'incline-db-press', name: 'Incline Dumbbell Press', category: 'Chest + Shoulders', notes: 'Swap for incline bench when bar/Smith station is unavailable.' },
    { id: 'weighted-dips', name: 'Dips', category: 'Chest + Triceps', notes: 'Only use if shoulders feel good and depth stays controlled.' }
  ],
  'decline-press': [
    { id: 'weighted-dips', name: 'Dips', category: 'Chest + Triceps', notes: 'Useful decline-style chest/triceps swap. Keep shoulder position controlled.' },
    { id: 'db-bench-press', name: 'Dumbbell Bench Press', category: 'Chest + Triceps', notes: 'Flat dumbbell press as a simple pressing swap.' }
  ],
  'weighted-pullups': [
    { id: 'assisted-pullups', name: 'Assisted Pull-ups', category: 'Back + Biceps', notes: 'Use if loaded reps are not clean. Log assistance/load notes in exercise notes.' },
    { id: 'lat-pulldown', name: 'Lat Pulldown', category: 'Back + Biceps', notes: 'Machine swap if the pull-up area is unavailable.' }
  ],
  'trap-bar-deadlift': [
    { id: 'romanian-deadlift', name: 'Romanian Deadlift', category: 'Posterior Chain', notes: 'Hinge swap. Use controlled lowering and avoid maxing.' },
    { id: 'kettlebell-swings', name: 'Kettlebell Swings', category: 'Power + Hinge', notes: 'Power/hinge swap. Keep it crisp, not sloppy.' }
  ],
  'barbell-row': [
    { id: 'cable-row', name: 'Cable Row', category: 'Back', notes: 'Lower-back friendlier row swap.' },
    { id: 'chest-supported-row', name: 'Chest-supported Row', category: 'Back', notes: 'Good swap if bracing or lower back is tired.' }
  ],
  'cable-row': [
    { id: 'barbell-row', name: 'Barbell Bent-over Row', category: 'Back', notes: 'Heavier row swap if lower back feels good.' },
    { id: 'chest-supported-row', name: 'Chest-supported Row', category: 'Back', notes: 'Stable row swap when cables are busy.' }
  ],
  'one-arm-db-row': [
    { id: 'cable-single-arm-row', name: 'Single-arm Cable Row', category: 'Back', notes: 'Similar unilateral pull with easier setup control.' }
  ],
  'shoulder-press-machine': [
    { id: 'db-shoulder-press', name: 'Dumbbell Shoulder Press', category: 'Shoulders', notes: 'Free-weight swap. Use a load you can control without throwing.' },
    { id: 'seated-barbell-press', name: 'Seated Barbell Press', category: 'Shoulders', notes: 'Pressing swap if setup is safe and comfortable.' }
  ],
  'db-shoulder-press': [
    { id: 'shoulder-press-machine', name: 'Shoulder Press Machine', category: 'Shoulders', notes: 'Machine swap if dumbbells are unavailable or stabilisers feel tired.' }
  ],
  'bulgarian-split-squat': [
    { id: 'reverse-lunges', name: 'Reverse Lunges', category: 'Quads + Glutes', notes: 'Less setup-heavy single-leg alternative.' },
    { id: 'step-ups', name: 'Step-ups', category: 'Quads + Glutes', notes: 'Controlled single-leg swap. Use a safe step height.' }
  ],
  'reverse-lunges': [
    { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', category: 'Quads + Glutes', notes: 'Stronger single-leg alternative if setup is available.' },
    { id: 'step-ups', name: 'Step-ups', category: 'Quads + Glutes', notes: 'Knee-friendly option when controlled.' }
  ],
  'single-leg-rdl': [
    { id: 'seated-leg-curl', name: 'Seated Leg Curl', category: 'Hamstrings', notes: 'Direct hamstring swap if balance is limiting today.' },
    { id: 'romanian-deadlift', name: 'Romanian Deadlift', category: 'Posterior Chain', notes: 'Bilateral hinge swap. Use strict control.' }
  ],
  'seated-leg-curl': [
    { id: 'single-leg-rdl', name: 'Single-leg RDL', category: 'Hamstrings + Glutes', notes: 'Balance and hinge-focused hamstring alternative.' }
  ]
};

const MAIN_LIFT_IDS = new Set([...REST_RULES.mainStrength, 'db-bench-press', 'incline-db-press', 'lat-pulldown', 'romanian-deadlift', 'seated-barbell-press', 'goblet-squat']);

const THEME_OPTIONS = [
  { id: 'tiger', label: 'Tigerfire' },
  { id: 'ember', label: 'Ember' },
  { id: 'steel', label: 'Steel' },
  { id: 'royal', label: 'Royal' },
  { id: 'forest', label: 'Forest' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'aurora', label: 'Aurora' },
  { id: 'midnight', label: 'Midnight' },
  { id: 'arctic', label: 'Arctic Dark' },
  { id: 'crimson', label: 'Crimson' },
  { id: 'gold', label: 'Gold' },
  { id: 'violet', label: 'Violet' },
  { id: 'volcanic-ice', label: 'Volcanic Ice' },
  { id: 'neon-jungle', label: 'Neon Jungle' },
  { id: 'solar-ocean', label: 'Solar Ocean' },
  { id: 'royal-ember', label: 'Royal Ember' },
  { id: 'crimson-steel', label: 'Crimson Steel' },
  { id: 'forest-gold', label: 'Forest Gold' },
  { id: 'aurora-flame', label: 'Aurora Flame' },
  { id: 'midnight-mint', label: 'Midnight Mint' },
  { id: 'desert-storm', label: 'Desert Storm' },
  { id: 'inferno-violet', label: 'Inferno Violet' },
  { id: 'high-contrast', label: 'High Contrast' }
];

const FONT_OPTIONS = [
  { id: 'system', label: 'System default', stack: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  { id: 'inter', label: 'Inter style', stack: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  { id: 'segoe', label: 'Segoe UI', stack: '"Segoe UI", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif' },
  { id: 'aptos', label: 'Aptos / modern', stack: 'Aptos, Calibri, "Segoe UI", ui-sans-serif, system-ui, sans-serif' },
  { id: 'arial', label: 'Arial', stack: 'Arial, Helvetica, sans-serif' },
  { id: 'verdana', label: 'Verdana', stack: 'Verdana, Geneva, sans-serif' },
  { id: 'trebuchet', label: 'Trebuchet MS', stack: '"Trebuchet MS", "Segoe UI", sans-serif' },
  { id: 'tahoma', label: 'Tahoma', stack: 'Tahoma, Geneva, Verdana, sans-serif' },
  { id: 'georgia', label: 'Georgia', stack: 'Georgia, "Times New Roman", serif' },
  { id: 'palatino', label: 'Palatino', stack: 'Palatino, "Palatino Linotype", Georgia, serif' },
  { id: 'lucida', label: 'Lucida', stack: '"Lucida Sans", "Lucida Grande", "Segoe UI", sans-serif' },
  { id: 'mono', label: 'Mono', stack: '"Cascadia Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace' }
];

const PLAN = {
  A: {
    monday: {
      id: 'A-monday', day: 'monday', type: 'cardio', title: 'Easy Run + Strides', focus: 'Aerobic fitness, running economy and recovery-friendly calorie expenditure',
      summary: 'A genuinely easy base run with short relaxed strides so the week begins with variety without draining Tuesday strength.',
      exercises: [
        { id: 'easy-run', name: 'Easy Aerobic Run', category: 'Cardio', sets: 1, reps: '45–60 min', target: '5.8–6.1 mph, conversational', purpose: 'Aerobic base, recovery capacity and total fat-loss support', notes: 'Warm up for 5–8 minutes. Keep most of the run easy enough to speak in full sentences. Increase duration before speed.' },
        { id: 'strides', name: 'Relaxed Strides', category: 'Cardio', sets: 6, reps: '20 sec + 60–90 sec easy', target: 'Fast and smooth, never an all-out sprint', purpose: 'Running economy, leg speed and technique', notes: 'Add after the easy run. Build speed gradually, stay relaxed, then walk or jog until fully ready for the next repetition.' }
      ]
    },
    tuesday: {
      id: 'A-tuesday', day: 'tuesday', type: 'strength', title: 'Push + Quads + Roll-out Power', focus: 'Heavy compound strength, high muscular demand and advanced anti-extension core work',
      exercises: [
        { id: 'bench-smith-press', name: 'Bench Press / Smith Press', category: 'Chest + Triceps', sets: 4, reps: '3–6', target: 'Main strength lift', purpose: 'Horizontal push strength and high total-body training demand', notes: 'Rest 2–4 minutes. Stop before form breaks.' },
        { id: 'smith-squat', name: 'Smith Squat', category: 'Quads + Glutes', sets: 3, reps: '4–8', target: 'Controlled strength reps', purpose: 'Large-muscle strength, bracing and energy expenditure', notes: 'Squat vertically, control depth and keep knees tracking comfortably.' },
        { id: 'incline-press', name: 'Incline Bench Press', category: 'Chest + Shoulders', sets: 3, reps: '5–8', target: 'Secondary compound', purpose: 'Upper-chest strength and additional compound volume', notes: 'Keep shoulder blades set and use a controlled range.' },
        { id: 'weighted-dips', name: 'Dips', category: 'Chest + Triceps', sets: 3, reps: '4–8', target: 'Strength reps', purpose: 'Relative pressing strength for advanced calisthenics', notes: 'Keep shoulder position controlled. Add load only after strong full-range reps.' },
        { id: 'face-pulls', name: 'Face Pulls', category: 'Shoulder Health', sets: 3, reps: '12–20', target: 'Controlled accessory', purpose: 'Rear delts, rotator cuff and pressing balance', notes: 'Light to moderate. Prioritise scapular control.' },
        { id: 'standing-rollout-progression', name: 'Standing Roll-out Progression', category: 'Monster Core · Anti-extension', sets: 3, reps: '3–6', target: 'Deepest repeatable standing range', purpose: 'Progress from standing to full extension and back', notes: 'Use a wall, raised bar, ramp or shortened floor range. Advance the range only after every rep returns under control with ribs down.' },
        { id: 'hollow-body-hold', name: 'Hollow-body Hold', category: 'Monster Core · Body tension', sets: 3, reps: '20–40 sec', target: 'Lower back gently pressed down', purpose: 'Gymnastics-style whole-body tension for roll-outs, L-sits and hanging work', notes: 'Choose a tuck, one-leg or full hollow position. End the set as soon as the lower back lifts.' },
        { id: 'sled-push-finisher', name: 'Sled Push or Incline Power-Walk Finisher', category: 'Fat-loss Conditioning', sets: 6, reps: '30–45 sec work + 45–60 sec easy', target: 'Hard but repeatable', purpose: 'High-output conditioning without adding another running session', notes: 'Use a sled when available; otherwise use a brisk incline walk. Keep the effort strong, never frantic.' }
      ]
    },
    wednesday: {
      id: 'A-wednesday', day: 'wednesday', type: 'cardio', title: 'Hill + Interval Combination', focus: 'Hill strength, speed endurance and 2–3 mile performance',
      summary: 'One structured session combining a controlled hill block with target-pace intervals.',
      exercises: [
        { id: 'hill-repeats', name: 'Controlled Hill Repeats', category: 'Cardio', sets: 6, reps: '60–75 sec uphill + 90 sec easy', target: '4–6% treadmill incline or a steady outdoor hill', purpose: 'Running-specific strength, power and aerobic demand', notes: 'Warm up 10 minutes. Use a speed you can repeat cleanly. Avoid steep downhill running; recover on flat ground or lower the treadmill incline.' },
        { id: 'target-pace-intervals', name: 'Target-Pace Intervals', category: 'Cardio', sets: 4, reps: '4 min work + 2 min easy', target: '7.2–7.4 mph work; 5.0–5.8 mph easy', purpose: 'Make your current 3-mile pace feel controlled and repeatable', notes: 'Begin after 3–4 easy minutes following the hill block. Finish with an 8–10 minute cooldown. Leave one good repetition in reserve.' }
      ]
    },
    thursday: {
      id: 'A-thursday', day: 'thursday', type: 'strength', title: 'Pull + Hinge + Hanging Core', focus: 'Posterior-chain strength, grip, waist stability and strict hanging compression',
      exercises: [
        { id: 'weighted-pullups', name: 'Pull-ups', category: 'Back + Biceps', sets: 4, reps: '3–6', target: 'Main strength lift', purpose: 'Vertical pulling and advanced calisthenics strength', notes: 'Use strict reps. Add weight only after strong full-range repetitions.' },
        { id: 'trap-bar-deadlift', name: 'Trap/Hex-Bar Deadlift', category: 'Posterior Chain', sets: 3, reps: '3–5', target: 'Strength reps', purpose: 'Large-muscle strength, bracing and high training demand', notes: 'Keep reps crisp and stop well before failure.' },
        { id: 'barbell-row', name: 'Barbell Bent-over Row', category: 'Back', sets: 3, reps: '5–8', target: 'Heavy row', purpose: 'Mid-back, lats and static trunk strength', notes: 'Keep the torso controlled. Do not jerk repetitions.' },
        { id: 'one-arm-db-row', name: 'One-arm Dumbbell Row', category: 'Back', sets: 3, reps: '6–10 each side', target: 'Controlled unilateral reps', purpose: 'Lat strength and anti-rotation control', notes: 'Brace hard and avoid twisting through the torso.' },
        { id: 'db-curls', name: 'Dumbbell Curls', category: 'Biceps', sets: 3, reps: '6–10', target: 'Clean strength reps', purpose: 'Biceps and forearm strength for pulling', notes: 'Keep elbows close and lift without swinging.' },
        { id: 'farmers-walks', name: 'Heavy Farmer’s Walks', category: 'Grip + Monster Core', sets: 4, reps: '30–60 sec', target: 'Heavy, tall and controlled', purpose: 'Loaded trunk stiffness, grip, posture and full-body conditioning', notes: 'Walk slowly with ribs stacked over the pelvis. Do not lean or rush.' },
        { id: 'hanging-leg-raises', name: 'Strict Hanging Leg Raises', category: 'Monster Core · Compression', sets: 4, reps: '6–10', target: 'Straight legs toward bar height', purpose: 'Build toward toes-to-bar and weighted hanging leg raises', notes: 'Start each rep from stillness. Progress knee raise → straight-leg raise → toes-to-bar. Add weight only after strict swing-free reps.' },
        { id: 'pallof-press', name: 'Heavy Pallof Press', category: 'Monster Core · Anti-rotation', sets: 3, reps: '8–12 each side', target: 'Two-second hold at full reach', purpose: 'Waist strength and resistance to twisting', notes: 'Brace, press slowly and prevent the cable from rotating you.' }
      ]
    },
    friday: {
      id: 'A-friday', day: 'friday', type: 'strength', title: 'Shoulders + Athletic Legs + L-sit', focus: 'Athletic strength, knee-supporting work, calisthenics compression and conditioning',
      exercises: [
        { id: 'shoulder-press-machine', name: 'Shoulder Press Machine', category: 'Shoulders', sets: 4, reps: '3–6', target: 'Main shoulder lift', purpose: 'Vertical pressing strength', notes: 'Drive evenly and avoid excessive lower-back arch.' },
        { id: 'lateral-raises', name: 'Lateral Raises', category: 'Side Delts', sets: 3, reps: '10–15', target: 'Controlled accessory', purpose: 'Shoulder width and balance', notes: 'Use smooth reps without swinging.' },
        { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', category: 'Quads + Glutes', sets: 3, reps: '5–8 each leg', target: 'Single-leg strength', purpose: 'Leg strength, balance and knee control', notes: 'Use a stable setup and keep the front knee comfortable.' },
        { id: 'single-leg-rdl', name: 'Single-leg RDL', category: 'Hamstrings + Glutes', sets: 3, reps: '5–8 each leg', target: 'Slow strength reps', purpose: 'Hamstrings, balance and hip control', notes: 'Move slowly and keep the hips square.' },
        { id: 'standing-calf-raises', name: 'Standing Calf Raises', category: 'Calves', sets: 3, reps: '8–15', target: 'Controlled reps', purpose: 'Calf strength and running support', notes: 'Pause at the top and lower under control.' },
        { id: 'hip-abduction', name: 'Hip Abduction / Banded Lateral Walks', category: 'Hip Stability', sets: 3, reps: '12–20', target: 'Controlled resilience work', purpose: 'Glute medius strength and knee stability', notes: 'Move from the hips and keep the torso steady.' },
        { id: 'l-sit-hold', name: 'L-sit Progression Hold', category: 'Monster Core · Compression', sets: 4, reps: '10–30 sec', target: 'Tuck → one-leg → full L-sit', purpose: 'Advanced calisthenics compression, hip-flexor and straight-arm strength', notes: 'Press the shoulders down, lock the elbows and keep the legs as high as your current progression allows.' },
        { id: 'air-bike-intervals', name: 'Air Bike or Rower Intervals', category: 'Fat-loss Conditioning', sets: 6, reps: '30 sec hard + 60 sec easy', target: 'Hard but repeatable', purpose: 'High-intensity conditioning and total calorie expenditure', notes: 'Choose the bike if the knees or shins need a break from impact. Do not sprint the first repetition.' }
      ]
    }
  },
  B: {
    monday: {
      id: 'B-monday', day: 'monday', type: 'cardio', title: 'Long Easy Progression Run', focus: 'Endurance, six-mile foundation and controlled pace change',
      summary: 'An easy long run that finishes slightly quicker without becoming a race.',
      exercises: [
        { id: 'long-easy-run', name: 'Long Easy Run', category: 'Cardio', sets: 1, reps: '50–65 min', target: '5.8–6.2 mph, conversational', purpose: 'Aerobic base and total fat-loss support', notes: 'Keep the opening 75–80% relaxed. Shorten the run when the legs are heavy.' },
        { id: 'progression-finish', name: 'Controlled Progression Finish', category: 'Cardio', sets: 1, reps: '10–15 min', target: 'Increase by 0.2–0.4 mph, still below tempo effort', purpose: 'Teach pace control and finish strength without excessive fatigue', notes: 'The final section should feel steady, not hard. Skip it when recovery is poor.' }
      ]
    },
    tuesday: {
      id: 'B-tuesday', day: 'tuesday', type: 'strength', title: 'Push Variation + Core Strength Reserve', focus: 'Compound pressing, quad strength and the foundations for full standing roll-outs',
      exercises: [
        { id: 'bench-smith-press', name: 'Bench Press / Smith Press', category: 'Chest + Triceps', sets: 4, reps: '3–6', target: 'Main strength lift', purpose: 'Horizontal push strength and high total-body training demand', notes: 'Use the same progression rules as Week 1.' },
        { id: 'leg-press', name: 'Leg Press', category: 'Quads + Glutes', sets: 3, reps: '5–8', target: 'Secondary lower-body strength', purpose: 'Large-muscle strength and energy expenditure', notes: 'Use a controlled range and avoid aggressive knee lockout.' },
        { id: 'decline-press', name: 'Decline Bench Press', category: 'Chest + Triceps', sets: 3, reps: '5–8', target: 'Press variation', purpose: 'Chest and triceps strength', notes: 'Control the descent and keep shoulders comfortable.' },
        { id: 'flyes', name: 'Dumbbell or Cable Flyes', category: 'Chest', sets: 3, reps: '8–12', target: 'Accessory', purpose: 'Controlled chest volume', notes: 'Use a controlled stretch rather than chasing heavy loads.' },
        { id: 'ez-french-press', name: 'EZ-bar French Press', category: 'Triceps', sets: 3, reps: '8–10', target: 'Accessory strength', purpose: 'Triceps strength for pressing and calisthenics', notes: 'Switch to rope pulldowns if elbows are uncomfortable.' },
        { id: 'external-rotations', name: 'Cable External Rotations', category: 'Shoulder Health', sets: 2, reps: '12–20', target: 'Light and strict', purpose: 'Rotator cuff strength and shoulder resilience', notes: 'Keep the elbow position fixed.' },
        { id: 'kneeling-rollouts', name: 'Full-range Kneeling Roll-outs', category: 'Monster Core · Anti-extension', sets: 4, reps: '6–12', target: 'Long pause at full extension', purpose: 'Build the strength reserve required for full standing roll-outs', notes: 'Reach as far as possible with ribs down, pause, then pull back without sitting the hips first.' },
        { id: 'long-lever-plank', name: 'Long-lever RKC Plank', category: 'Monster Core · Bracing', sets: 3, reps: '20–40 sec', target: 'Maximum whole-body tension', purpose: 'High-force bracing for roll-outs, heavy lifting and advanced calisthenics', notes: 'Place elbows slightly farther forward, squeeze glutes and pull elbows toward toes without moving.' }
      ]
    },
    wednesday: {
      id: 'B-wednesday', day: 'wednesday', type: 'cardio', title: 'Tempo + Fartlek Finish', focus: 'Lactate-threshold endurance, pace changes and speed reserve',
      summary: 'A sustained tempo block followed by short controlled surges for a different stimulus from Week 1.',
      exercises: [
        { id: 'tempo-run', name: 'Controlled Tempo Block', category: 'Cardio', sets: 1, reps: '20–25 min', target: '6.8–7.2 mph, comfortably hard', purpose: 'Raise sustained speed and make target pace feel more economical', notes: 'Warm up 10 minutes. Hold a pace you could sustain a little longer; do not turn this into a time trial.' },
        { id: 'fartlek-surges', name: 'Fartlek Surges', category: 'Cardio', sets: 6, reps: '1 min strong + 1 min easy float', target: 'Strong, smooth and faster than tempo', purpose: 'Speed reserve, rhythm changes and running variety', notes: 'Begin after 3 easy minutes following the tempo block. Cool down for 8–10 minutes after the final surge.' }
      ]
    },
    thursday: {
      id: 'B-thursday', day: 'thursday', type: 'strength', title: 'Pull Variation + Weighted Hanging Core', focus: 'Pulling strength, power conditioning, anti-lateral flexion and weighted compression',
      exercises: [
        { id: 'weighted-pullups', name: 'Pull-ups', category: 'Back + Biceps', sets: 4, reps: '3–6', target: 'Main strength lift', purpose: 'Vertical pulling and advanced calisthenics strength', notes: 'Use strict full-range reps.' },
        { id: 'cable-row', name: 'Cable Row', category: 'Back', sets: 3, reps: '5–8', target: 'Heavy row', purpose: 'Mid-back and lat strength', notes: 'Sit tall and control the return.' },
        { id: 'one-arm-db-row', name: 'One-arm Dumbbell Row', category: 'Back', sets: 3, reps: '6–10 each side', target: 'Unilateral rows', purpose: 'Lat strength and anti-rotation control', notes: 'Keep reps slow and avoid torso twist.' },
        { id: 'kettlebell-swings', name: 'Kettlebell Swings', category: 'Power + Conditioning', sets: 5, reps: '10', target: 'Explosive, crisp repetitions', purpose: 'Posterior-chain power and high-output conditioning', notes: 'Hinge rather than squat. Stop the set when speed or back position changes.' },
        { id: 'db-curls', name: 'Dumbbell Curls', category: 'Biceps', sets: 3, reps: '6–10', target: 'Clean strength reps', purpose: 'Biceps and forearms for pulling', notes: 'Progress only when every rep is controlled.' },
        { id: 'suitcase-carries', name: 'Heavy Suitcase Carries', category: 'Monster Core · Waist Strength', sets: 4, reps: '30–60 sec each side', target: 'Heavy with zero side-bend', purpose: 'Obliques, quadratus lumborum, grip and anti-lateral-flexion strength', notes: 'Walk tall and prevent the load from pulling the torso sideways.' },
        { id: 'hanging-leg-raises', name: 'Strict Hanging Leg Raises — Paused', category: 'Monster Core · Compression', sets: 4, reps: '6–10', target: 'Straight legs with a brief controlled pause', purpose: 'Build the strict compression strength required before weighted hanging leg raises', notes: 'Start from stillness, raise without swing, pause briefly at the top and lower under control. Tiger will offer the weighted version only after the clean standard is met.' },
        { id: 'pallof-press', name: 'Half-kneeling Pallof Press', category: 'Monster Core · Anti-rotation', sets: 3, reps: '8–12 each side', target: 'Two-second pause', purpose: 'Waist strength and control against rotation', notes: 'Keep hips and ribs square throughout.' }
      ]
    },
    friday: {
      id: 'B-friday', day: 'friday', type: 'strength', title: 'Shoulders + Posterior Chain + Dragon Flag', focus: 'Athletic strength, trunk control and a high-output conditioning finish',
      exercises: [
        { id: 'db-shoulder-press', name: 'Dumbbell Shoulder Press', category: 'Shoulders', sets: 4, reps: '3–6', target: 'Main shoulder lift', purpose: 'Vertical pressing and stabiliser strength', notes: 'Use a load you can control without throwing the dumbbells up.' },
        { id: 'reverse-flyes', name: 'Bent-over Reverse Flyes', category: 'Rear Delts', sets: 3, reps: '10–15', target: 'Controlled accessory', purpose: 'Rear delts and posture', notes: 'Hold briefly at the top.' },
        { id: 'reverse-lunges', name: 'Reverse Lunges', category: 'Quads + Glutes', sets: 3, reps: '5–8 each leg', target: 'Single-leg strength', purpose: 'Leg strength, balance and knee control', notes: 'Step back smoothly and keep the front foot planted.' },
        { id: 'seated-leg-curl', name: 'Seated Leg Curl', category: 'Hamstrings', sets: 3, reps: '6–10', target: 'Hamstring strength', purpose: 'Direct hamstring work and knee support', notes: 'Control the lowering phase.' },
        { id: 'single-leg-rdl', name: 'Single-leg RDL', category: 'Hamstrings + Glutes', sets: 3, reps: '5–8 each leg', target: 'Slow strength reps', purpose: 'Hamstring strength, balance and hip control', notes: 'Reduce to two sets when the running week has been especially demanding.' },
        { id: 'tibialis-raises', name: 'Tibialis Raises', category: 'Shins + Ankles', sets: 3, reps: '15–25', target: 'Controlled resilience work', purpose: 'Shin, ankle and running durability', notes: 'Lift toes under control and avoid rushing.' },
        { id: 'dragon-flag-eccentrics', name: 'Dragon Flag Eccentrics', category: 'Monster Core · Advanced anti-extension', sets: 3, reps: '3–6 slow lowers', target: '5–8 second eccentric', purpose: 'Extreme whole-body trunk tension for advanced calisthenics', notes: 'Begin tucked or one-leg. Keep shoulders anchored and lower only as far as the body stays rigid.' },
        { id: 'battle-rope-intervals', name: 'Battle Rope or Rower Intervals', category: 'Fat-loss Conditioning', sets: 8, reps: '20 sec hard + 40 sec easy', target: 'Powerful and repeatable', purpose: 'High-output conditioning and total calorie expenditure', notes: 'Use the rower if ropes are unavailable. Keep technique crisp and stop before output collapses.' }
      ]
    }
  }
};


const WORKOUT_PROGRAMME_TEMPLATES = [
  {
    id: 'gymnast-calisthenics',
    title: 'Calisthenics',
    subtitle: 'Pull-up strength, dips, core tension, shoulder control and single-leg strength using normal gym equipment.',
    badge: 'Body control',
    bestFor: 'Building relative strength and a gymnast-style base without needing wall handstand space.',
    note: 'Gym-based substitutions: pull-up bar, assisted pull-up machine, dip bars, cable station, dumbbells, bench and leg machines.',
    plan: {
      A: {
        monday: { id: 'GC-A-monday', day: 'monday', type: 'cardio', title: 'Easy Engine + Mobility Base', focus: 'Low-stress aerobic work to support recovery and bodyweight strength', summary: 'Keep this easy and repeatable.', exercises: [
          { id: 'zone2-run', name: 'Zone 2 Treadmill Run', category: 'Cardio', sets: 1, reps: '45–60 min', target: 'Easy conversational pace', purpose: 'Aerobic base and recovery', notes: 'Keep it comfortable. Do not turn this into a test.' }
        ]},
        tuesday: { id: 'GC-A-tuesday', day: 'tuesday', type: 'strength', title: 'Calisthenics Push + Core', focus: 'Dips, pressing strength and hollow-body control', exercises: [
          { id: 'weighted-dips', name: 'Dips', category: 'Chest + Triceps', sets: 4, reps: '3–6', target: 'Main strength lift', purpose: 'Pressing strength with body control', notes: 'Use bodyweight, assistance or additional load as appropriate. Keep shoulders controlled.' },
          { id: 'bench-smith-press', name: 'Bench Press / Smith Press', category: 'Chest + Triceps', sets: 3, reps: '4–8', target: 'Secondary press', purpose: 'Build raw pushing strength', notes: 'Use controlled reps and leave 1–2 reps in reserve.' },
          { id: 'db-shoulder-press', name: 'Dumbbell Shoulder Press', category: 'Shoulders', sets: 3, reps: '5–8', target: 'Vertical press', purpose: 'Shoulder strength for calisthenics', notes: 'Strict seated or standing reps.' },
          { id: 'rollouts', name: 'Ab Roll-outs', category: 'Core', sets: 3, reps: 'Quality reps', target: 'Anti-extension core', purpose: 'Hollow-body style trunk strength', notes: 'Only go as far as you can control.' },
          { id: 'external-rotations', name: 'Cable External Rotations', category: 'Shoulder Health', sets: 2, reps: '12–20', target: 'Prehab', purpose: 'Rotator cuff resilience', notes: 'Light and strict.' }
        ]},
        wednesday: { id: 'GC-A-wednesday', day: 'wednesday', type: 'cardio', title: 'Controlled Conditioning', focus: 'Fitness without damaging Thursday pulling strength', summary: 'Shorter quality work, not a race.', exercises: [
          { id: 'tempo-run', name: 'Controlled Tempo Run', category: 'Cardio', sets: 1, reps: '25–35 min', target: 'Moderate, smooth pace', purpose: 'Conditioning and work capacity', notes: 'Stay controlled. Finish feeling like you could do more.' }
        ]},
        thursday: { id: 'GC-A-thursday', day: 'thursday', type: 'strength', title: 'Pull-up Strength + Hanging Core', focus: 'Vertical pulling, lats, grip and hanging core strength', exercises: [
          { id: 'weighted-pullups', name: 'Pull-ups', category: 'Back + Biceps', sets: 5, reps: '2–5', target: 'Main strength lift', purpose: 'Relative pulling strength', notes: 'Use assistance, bodyweight or additional load. Full range, no swinging.' },
          { id: 'lat-pulldown', name: 'Lat Pulldown', category: 'Back', sets: 3, reps: '6–10', target: 'Volume pull', purpose: 'Lat strength if pull-up volume is limited', notes: 'Pull elbows down and avoid leaning back excessively.' },
          { id: 'cable-row', name: 'Cable Row', category: 'Back', sets: 3, reps: '6–10', target: 'Horizontal pull', purpose: 'Upper-back balance', notes: 'Pause briefly with shoulder blades back.' },
          { id: 'hanging-leg-raises', name: 'Hanging Leg Raises', category: 'Core', sets: 3, reps: 'Quality reps', target: 'Hanging core', purpose: 'Grip, abs and hip-flexor control', notes: 'Avoid swinging.' },
          { id: 'farmers-walks', name: 'Farmer’s Walks', category: 'Grip + Core', sets: 3, reps: '30–60 sec', target: 'Carries', purpose: 'Grip and trunk stiffness', notes: 'Tall posture, slow controlled walk.' }
        ]},
        friday: { id: 'GC-A-friday', day: 'friday', type: 'strength', title: 'Single-leg Strength + Shoulder Control', focus: 'Leg strength, balance and shoulder stability', exercises: [
          { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', category: 'Quads + Glutes', sets: 4, reps: '5–8 each leg', target: 'Single-leg strength', purpose: 'Leg strength and control', notes: 'Use a stable bench and controlled depth.' },
          { id: 'single-leg-rdl', name: 'Single-leg RDL', category: 'Hamstrings + Glutes', sets: 3, reps: '6–8 each leg', target: 'Balance hinge', purpose: 'Posterior-chain control', notes: 'Slow reps; do not chase load.' },
          { id: 'reverse-flyes', name: 'Reverse Flyes', category: 'Rear Delts', sets: 3, reps: '10–15', target: 'Shoulder control', purpose: 'Posture and shoulder balance', notes: 'Pause at the top.' },
          { id: 'lateral-raises', name: 'Lateral Raises', category: 'Side Delts', sets: 3, reps: '10–15', target: 'Accessory', purpose: 'Shoulder balance', notes: 'Strict reps, no swinging.' },
          { id: 'tibialis-raises', name: 'Tibialis Raises', category: 'Shins + Ankles', sets: 2, reps: '15–25', target: 'Resilience', purpose: 'Ankle and running support', notes: 'Controlled reps.' }
        ]}
      },
      B: {
        monday: { id: 'GC-B-monday', day: 'monday', type: 'cardio', title: 'Long Easy Base', focus: 'Aerobic support for bodyweight strength', summary: 'Easy aerobic work.', exercises: [
          { id: 'zone2-run', name: 'Long Easy Treadmill Run', category: 'Cardio', sets: 1, reps: '50–70 min', target: 'Easy conversational pace', purpose: 'Aerobic base', notes: 'Keep this genuinely easy.' }
        ]},
        tuesday: { id: 'GC-B-tuesday', day: 'tuesday', type: 'strength', title: 'Press Variation + Core', focus: 'Pressing strength and trunk control', exercises: [
          { id: 'bench-smith-press', name: 'Bench Press / Smith Press', category: 'Chest + Triceps', sets: 4, reps: '3–6', target: 'Main press', purpose: 'Raw push strength', notes: 'Controlled heavy reps.' },
          { id: 'weighted-dips', name: 'Dips', category: 'Chest + Triceps', sets: 3, reps: '5–8', target: 'Bodyweight press', purpose: 'Transfer to calisthenics strength', notes: 'Use assistance or load as needed.' },
          { id: 'shoulder-press-machine', name: 'Shoulder Press Machine', category: 'Shoulders', sets: 3, reps: '5–8', target: 'Vertical press', purpose: 'Shoulder strength', notes: 'Strict reps.' },
          { id: 'paused-rollouts', name: 'Paused Roll-outs', category: 'Core', sets: 3, reps: 'Quality reps', target: 'Core control', purpose: 'Anti-extension strength', notes: 'Pause only if form stays clean.' }
        ]},
        wednesday: { id: 'GC-B-wednesday', day: 'wednesday', type: 'cardio', title: 'Intervals Without Maxing', focus: 'Conditioning and athletic repeatability', summary: 'Short intervals, smooth recovery.', exercises: [
          { id: 'target-pace-intervals', name: 'Treadmill Intervals', category: 'Cardio', sets: 4, reps: '3 min work + 2 min easy', target: 'Hard but controlled', purpose: 'Work capacity', notes: 'No sprinting. Keep mechanics relaxed.' }
        ]},
        thursday: { id: 'GC-B-thursday', day: 'thursday', type: 'strength', title: 'Pull Volume + Grip', focus: 'Pulling volume, rows and grip endurance', exercises: [
          { id: 'weighted-pullups', name: 'Pull-ups', category: 'Back + Biceps', sets: 4, reps: '3–6', target: 'Main pull', purpose: 'Vertical pull strength', notes: 'Use clean full range.' },
          { id: 'assisted-pullups', name: 'Assisted Pull-ups', category: 'Back + Biceps', sets: 3, reps: '6–10', target: 'Volume', purpose: 'Extra quality pull-up practice', notes: 'Use enough assistance for perfect reps.' },
          { id: 'barbell-row', name: 'Barbell Bent-over Row', category: 'Back', sets: 3, reps: '5–8', target: 'Heavy row', purpose: 'Back strength', notes: 'Brace hard.' },
          { id: 'hanging-leg-raises', name: 'Hanging Leg Raises', category: 'Core', sets: 3, reps: 'Quality reps', target: 'Hanging core', purpose: 'Grip and trunk strength', notes: 'No swinging.' },
          { id: 'suitcase-carries', name: 'Suitcase Carries', category: 'Core + Grip', sets: 3, reps: '20–40 sec each side', target: 'Anti-lateral flexion', purpose: 'Obliques, grip and posture', notes: 'Stay tall; no leaning.' }
        ]},
        friday: { id: 'GC-B-friday', day: 'friday', type: 'strength', title: 'Legs + Athletic Control', focus: 'Gym-based leg strength and joint resilience', exercises: [
          { id: 'leg-press', name: 'Leg Press', category: 'Quads + Glutes', sets: 4, reps: '5–8', target: 'Main leg lift', purpose: 'Leg strength', notes: 'Controlled depth, no hard lockout.' },
          { id: 'reverse-lunges', name: 'Reverse Lunges', category: 'Quads + Glutes', sets: 3, reps: '6–8 each leg', target: 'Single-leg strength', purpose: 'Knee-friendly unilateral work', notes: 'Step back under control.' },
          { id: 'seated-leg-curl', name: 'Seated Leg Curl', category: 'Hamstrings', sets: 3, reps: '8–12', target: 'Hamstrings', purpose: 'Knee support and posterior chain', notes: 'Control the lowering.' },
          { id: 'standing-calf-raises', name: 'Standing Calf Raises', category: 'Calves', sets: 3, reps: '10–15', target: 'Calves', purpose: 'Ankle support', notes: 'Pause at top.' }
        ]}
      }
    }
  },
  {
    id: 'martial-arts',
    title: 'Martial Arts',
    subtitle: 'Rotational strength, single-leg control, grip, conditioning and resilient shoulders.',
    badge: 'Athletic power',
    bestFor: 'Becoming strong in ways that transfer to striking, grappling-style control, footwork and repeated efforts.',
    note: 'Gym-based substitutions: cable station, dumbbells, kettlebells, pull-up bar, leg machines and treadmill.',
    plan: {
      A: {
        monday: { id: 'MA-A-monday', day: 'monday', type: 'cardio', title: 'Easy Fight Engine', focus: 'Aerobic base for repeated rounds', summary: 'Build the engine without beating up your legs.', exercises: [
          { id: 'zone2-run', name: 'Zone 2 Treadmill Run', category: 'Cardio', sets: 1, reps: '45–60 min', target: 'Easy conversational pace', purpose: 'Aerobic base for recovery between efforts', notes: 'Smooth and easy.' }
        ]},
        tuesday: { id: 'MA-A-tuesday', day: 'tuesday', type: 'strength', title: 'Push + Rotation', focus: 'Upper-body strength with rotational trunk control', exercises: [
          { id: 'bench-smith-press', name: 'Bench Press / Smith Press', category: 'Chest + Triceps', sets: 4, reps: '3–6', target: 'Main strength lift', purpose: 'Upper-body force production', notes: 'Strict reps.' },
          { id: 'cable-chop', name: 'Cable Wood Chop', category: 'Rotational Core', sets: 3, reps: '8–12 each side', target: 'Rotation', purpose: 'Rotational trunk strength', notes: 'Move through the trunk and hips, not just the arms.' },
          { id: 'weighted-dips', name: 'Dips', category: 'Chest + Triceps', sets: 3, reps: '5–8', target: 'Pressing strength', purpose: 'Close-range pushing strength', notes: 'Shoulders controlled.' },
          { id: 'pallof-press', name: 'Pallof Press', category: 'Core', sets: 3, reps: '8–12 each side', target: 'Anti-rotation', purpose: 'Core control under force', notes: 'Hold ribs down; resist twisting.' },
          { id: 'external-rotations', name: 'Cable External Rotations', category: 'Shoulder Health', sets: 2, reps: '12–20', target: 'Prehab', purpose: 'Shoulder resilience', notes: 'Light and strict.' }
        ]},
        wednesday: { id: 'MA-A-wednesday', day: 'wednesday', type: 'cardio', title: 'Round-Based Conditioning', focus: 'Repeatable hard efforts', summary: 'Conditioning without reckless sprinting.', exercises: [
          { id: 'round-intervals', name: 'Treadmill Round Intervals', category: 'Cardio', sets: 5, reps: '2 min strong + 1 min easy', target: 'Hard but repeatable', purpose: 'Repeated effort conditioning', notes: 'Think controlled rounds, not all-out sprinting.' }
        ]},
        thursday: { id: 'MA-A-thursday', day: 'thursday', type: 'strength', title: 'Pull + Hinge + Grip', focus: 'Pulling, hip drive and grip', exercises: [
          { id: 'weighted-pullups', name: 'Pull-ups', category: 'Back + Biceps', sets: 4, reps: '3–6', target: 'Main pull', purpose: 'Grip and pulling strength', notes: 'Full range.' },
          { id: 'trap-bar-deadlift', name: 'Trap/Hex-Bar Deadlift', category: 'Posterior Chain', sets: 3, reps: '3–5', target: 'Hinge strength', purpose: 'Hip and total-body strength', notes: 'Strong brace; no maxing.' },
          { id: 'cable-row', name: 'Cable Row', category: 'Back', sets: 3, reps: '6–10', target: 'Rows', purpose: 'Upper-back strength', notes: 'Pause briefly.' },
          { id: 'kettlebell-swings', name: 'Kettlebell Swings', category: 'Power + Hinge', sets: 3, reps: '8–12', target: 'Power', purpose: 'Hip snap and conditioning', notes: 'Crisp hinge, not squatty.' },
          { id: 'farmers-walks', name: 'Farmer’s Walks', category: 'Grip + Core', sets: 3, reps: '30–60 sec', target: 'Carries', purpose: 'Grip and trunk strength', notes: 'Tall posture.' }
        ]},
        friday: { id: 'MA-A-friday', day: 'friday', type: 'strength', title: 'Legs + Footwork Strength', focus: 'Single-leg strength, hips and resilience', exercises: [
          { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', category: 'Quads + Glutes', sets: 3, reps: '5–8 each leg', target: 'Single-leg strength', purpose: 'Kicking/stance strength', notes: 'Controlled reps.' },
          { id: 'reverse-lunges', name: 'Reverse Lunges', category: 'Quads + Glutes', sets: 3, reps: '6–10 each leg', target: 'Unilateral strength', purpose: 'Footwork and knee control', notes: 'Step back smoothly.' },
          { id: 'hip-abduction', name: 'Hip Abduction / Banded Lateral Walks', category: 'Hip Stability', sets: 3, reps: '12–20', target: 'Hip control', purpose: 'Knee and hip stability', notes: 'Slow and controlled.' },
          { id: 'standing-calf-raises', name: 'Standing Calf Raises', category: 'Calves', sets: 3, reps: '10–15', target: 'Lower-leg strength', purpose: 'Footwork support', notes: 'Pause at top.' }
        ]}
      },
      B: {
        monday: { id: 'MA-B-monday', day: 'monday', type: 'cardio', title: 'Easy Base + Recovery', focus: 'Recovery capacity', summary: 'Easy aerobic work.', exercises: [
          { id: 'zone2-run', name: 'Easy Treadmill Run', category: 'Cardio', sets: 1, reps: '45–65 min', target: 'Easy conversational pace', purpose: 'Aerobic base', notes: 'Comfortable pace.' }
        ]},
        tuesday: { id: 'MA-B-tuesday', day: 'tuesday', type: 'strength', title: 'Press + Anti-rotation', focus: 'Pressing and trunk stiffness', exercises: [
          { id: 'incline-press', name: 'Incline Press', category: 'Chest + Shoulders', sets: 4, reps: '4–8', target: 'Pressing strength', purpose: 'Upper-body force', notes: 'Controlled reps.' },
          { id: 'db-shoulder-press', name: 'Dumbbell Shoulder Press', category: 'Shoulders', sets: 3, reps: '5–8', target: 'Shoulder strength', purpose: 'Striking structure and shoulder strength', notes: 'Strict reps.' },
          { id: 'pallof-press', name: 'Pallof Press', category: 'Core', sets: 3, reps: '8–12 each side', target: 'Anti-rotation', purpose: 'Trunk control', notes: 'Do not rotate.' },
          { id: 'rollouts', name: 'Ab Roll-outs', category: 'Core', sets: 3, reps: 'Quality reps', target: 'Anti-extension', purpose: 'Core stiffness', notes: 'Controlled range.' }
        ]},
        wednesday: { id: 'MA-B-wednesday', day: 'wednesday', type: 'cardio', title: 'Tempo Rounds', focus: 'Sustained fight-style conditioning', summary: 'Sustained hard but controlled work.', exercises: [
          { id: 'tempo-run', name: 'Controlled Tempo Run', category: 'Cardio', sets: 1, reps: '25–35 min', target: 'Moderate-hard but controlled', purpose: 'Conditioning', notes: 'No maxing.' }
        ]},
        thursday: { id: 'MA-B-thursday', day: 'thursday', type: 'strength', title: 'Pull + Loaded Core', focus: 'Pulling and loaded trunk strength', exercises: [
          { id: 'weighted-pullups', name: 'Pull-ups', category: 'Back + Biceps', sets: 4, reps: '3–6', target: 'Vertical pull', purpose: 'Pulling and grip', notes: 'Strict reps.' },
          { id: 'barbell-row', name: 'Barbell Bent-over Row', category: 'Back', sets: 3, reps: '5–8', target: 'Heavy row', purpose: 'Back and bracing', notes: 'Brace hard.' },
          { id: 'single-arm-cable-row', name: 'Single-arm Cable Row', category: 'Back + Core', sets: 3, reps: '8–10 each side', target: 'Unilateral pull', purpose: 'Anti-rotation pull strength', notes: 'Do not twist.' },
          { id: 'suitcase-carries', name: 'Suitcase Carries', category: 'Core + Grip', sets: 3, reps: '20–40 sec each side', target: 'Carries', purpose: 'Oblique and grip strength', notes: 'Stay tall.' }
        ]},
        friday: { id: 'MA-B-friday', day: 'friday', type: 'strength', title: 'Lower Body Power + Resilience', focus: 'Hips, legs and lower-leg durability', exercises: [
          { id: 'leg-press', name: 'Leg Press', category: 'Quads + Glutes', sets: 4, reps: '5–8', target: 'Leg strength', purpose: 'Lower-body force', notes: 'Controlled.' },
          { id: 'kettlebell-swings', name: 'Kettlebell Swings', category: 'Power + Hinge', sets: 4, reps: '8–12', target: 'Hip power', purpose: 'Power and conditioning', notes: 'Explosive but clean.' },
          { id: 'seated-leg-curl', name: 'Seated Leg Curl', category: 'Hamstrings', sets: 3, reps: '8–12', target: 'Hamstrings', purpose: 'Knee support', notes: 'Control lowering.' },
          { id: 'tibialis-raises', name: 'Tibialis Raises', category: 'Shins + Ankles', sets: 2, reps: '15–25', target: 'Lower-leg resilience', purpose: 'Ankle and shin durability', notes: 'Controlled reps.' }
        ]}
      }
    }
  },
  {
    id: 'tactical-elite',
    title: 'Elite Military',
    subtitle: 'SAS/SBS-inspired gym plan for load carriage, pull-ups, hinges, carries, work capacity and durability.',
    badge: 'Tactical strength',
    bestFor: 'Building a stronger tactical-style base in a normal gym without claiming to replicate official selection preparation.',
    note: 'Gym-based substitutions: treadmill incline, trap bar, pull-up bar, dumbbells, kettlebells, step/bench, cable station and carries.',
    plan: {
      A: {
        monday: { id: 'TE-A-monday', day: 'monday', type: 'cardio', title: 'Load-Carriage Base', focus: 'Aerobic base and loaded walking capacity', summary: 'Tactical-style engine without excessive impact.', exercises: [
          { id: 'incline-walk', name: 'Incline Treadmill Walk', category: 'Cardio', sets: 1, reps: '40–60 min', target: 'Brisk incline walk; optional light pack if safe', purpose: 'Load-carriage base', notes: 'Keep posture tall. Do not overload your knees.' }
        ]},
        tuesday: { id: 'TE-A-tuesday', day: 'tuesday', type: 'strength', title: 'Push + Legs Strength-Endurance', focus: 'Pressing, legs and trunk under fatigue', exercises: [
          { id: 'bench-smith-press', name: 'Bench Press / Smith Press', category: 'Chest + Triceps', sets: 4, reps: '4–8', target: 'Main push', purpose: 'Upper-body strength', notes: 'Clean reps.' },
          { id: 'leg-press', name: 'Leg Press', category: 'Quads + Glutes', sets: 4, reps: '6–10', target: 'Leg strength', purpose: 'Load carriage leg base', notes: 'Controlled depth.' },
          { id: 'weighted-dips', name: 'Dips', category: 'Chest + Triceps', sets: 3, reps: '5–10', target: 'Strength-endurance', purpose: 'Pressing endurance', notes: 'Use assistance if needed.' },
          { id: 'rollouts', name: 'Ab Roll-outs', category: 'Core', sets: 3, reps: 'Quality reps', target: 'Core', purpose: 'Bracing and trunk strength', notes: 'Controlled range.' },
          { id: 'farmers-walks', name: 'Farmer’s Walks', category: 'Grip + Core', sets: 3, reps: '40–60 sec', target: 'Carries', purpose: 'Grip, traps and trunk', notes: 'Walk tall.' }
        ]},
        wednesday: { id: 'TE-A-wednesday', day: 'wednesday', type: 'cardio', title: 'Tactical Intervals', focus: 'Repeatable hard efforts', summary: 'Useful conditioning without random brutality.', exercises: [
          { id: 'tactical-intervals', name: 'Treadmill Intervals', category: 'Cardio', sets: 6, reps: '2 min hard + 2 min easy', target: 'Hard but repeatable', purpose: 'Work capacity', notes: 'Keep all reps repeatable. Stop if form collapses.' }
        ]},
        thursday: { id: 'TE-A-thursday', day: 'thursday', type: 'strength', title: 'Pull + Hinge + Carry', focus: 'Pull-ups, posterior chain and loaded grip', exercises: [
          { id: 'weighted-pullups', name: 'Pull-ups', category: 'Back + Biceps', sets: 5, reps: '3–6', target: 'Main pull', purpose: 'Tactical pulling strength', notes: 'Strict full-range reps.' },
          { id: 'trap-bar-deadlift', name: 'Trap/Hex-Bar Deadlift', category: 'Posterior Chain', sets: 4, reps: '3–5', target: 'Main hinge', purpose: 'Total-body strength', notes: 'No grinder reps.' },
          { id: 'cable-row', name: 'Cable Row', category: 'Back', sets: 3, reps: '6–10', target: 'Rows', purpose: 'Back strength', notes: 'Pause briefly.' },
          { id: 'kettlebell-walks', name: 'Kettlebell Walks', category: 'Grip + Core', sets: 3, reps: '40–60 sec', target: 'Carries', purpose: 'Grip and trunk endurance', notes: 'Tall posture.' },
          { id: 'hanging-leg-raises', name: 'Hanging Leg Raises', category: 'Core', sets: 3, reps: 'Quality reps', target: 'Core', purpose: 'Grip and abs', notes: 'No swinging.' }
        ]},
        friday: { id: 'TE-A-friday', day: 'friday', type: 'strength', title: 'Legs + Durability', focus: 'Single-leg capacity and tissue resilience', exercises: [
          { id: 'step-ups', name: 'Weighted Step-ups', category: 'Quads + Glutes', sets: 3, reps: '6–10 each leg', target: 'Load carriage legs', purpose: 'Hills/stairs transfer', notes: 'Use a safe box or bench height.' },
          { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', category: 'Quads + Glutes', sets: 3, reps: '5–8 each leg', target: 'Single-leg strength', purpose: 'Leg strength and control', notes: 'Controlled depth.' },
          { id: 'seated-leg-curl', name: 'Seated Leg Curl', category: 'Hamstrings', sets: 3, reps: '8–12', target: 'Hamstrings', purpose: 'Knee support', notes: 'Control lowering.' },
          { id: 'standing-calf-raises', name: 'Standing Calf Raises', category: 'Calves', sets: 3, reps: '10–15', target: 'Calves', purpose: 'Lower-leg endurance', notes: 'Pause at top.' },
          { id: 'tibialis-raises', name: 'Tibialis Raises', category: 'Shins + Ankles', sets: 2, reps: '15–25', target: 'Shins', purpose: 'Marching/running durability', notes: 'Controlled reps.' }
        ]}
      },
      B: {
        monday: { id: 'TE-B-monday', day: 'monday', type: 'cardio', title: 'Long Easy Engine', focus: 'Sustainable aerobic base', summary: 'Aerobic capacity with low mental friction.', exercises: [
          { id: 'zone2-run', name: 'Long Easy Treadmill Run', category: 'Cardio', sets: 1, reps: '55–75 min', target: 'Easy conversational pace', purpose: 'Aerobic base', notes: 'Keep it easy enough to recover.' }
        ]},
        tuesday: { id: 'TE-B-tuesday', day: 'tuesday', type: 'strength', title: 'Strength-Endurance Push', focus: 'Pressing volume and trunk work', exercises: [
          { id: 'bench-smith-press', name: 'Bench Press / Smith Press', category: 'Chest + Triceps', sets: 4, reps: '5–8', target: 'Strength-endurance', purpose: 'Pressing capacity', notes: 'Clean reps.' },
          { id: 'press-ups', name: 'Press-ups', category: 'Chest + Triceps', sets: 3, reps: 'Near-clean limit', target: 'Bodyweight endurance', purpose: 'Simple pushing endurance', notes: 'Stop before form collapses.' },
          { id: 'leg-press', name: 'Leg Press', category: 'Quads + Glutes', sets: 3, reps: '8–12', target: 'Leg volume', purpose: 'Leg durability', notes: 'Controlled.' },
          { id: 'pallof-press', name: 'Pallof Press', category: 'Core', sets: 3, reps: '8–12 each side', target: 'Anti-rotation', purpose: 'Trunk control', notes: 'Do not twist.' }
        ]},
        wednesday: { id: 'TE-B-wednesday', day: 'wednesday', type: 'cardio', title: 'Hill / Incline Intervals', focus: 'Leg and lung capacity', summary: 'Incline treadmill work for tactical-style conditioning.', exercises: [
          { id: 'incline-intervals', name: 'Incline Treadmill Intervals', category: 'Cardio', sets: 5, reps: '3 min incline + 2 min easy', target: 'Brisk, controlled incline', purpose: 'Hill capacity', notes: 'Use incline before speed. Keep knees comfortable.' }
        ]},
        thursday: { id: 'TE-B-thursday', day: 'thursday', type: 'strength', title: 'Pull Volume + Posterior Chain', focus: 'Back, grip and hinge strength', exercises: [
          { id: 'weighted-pullups', name: 'Pull-ups', category: 'Back + Biceps', sets: 4, reps: '3–6', target: 'Main pull', purpose: 'Pulling strength', notes: 'Strict reps.' },
          { id: 'barbell-row', name: 'Barbell Bent-over Row', category: 'Back', sets: 3, reps: '5–8', target: 'Heavy row', purpose: 'Back and bracing', notes: 'Brace hard.' },
          { id: 'romanian-deadlift', name: 'Romanian Deadlift', category: 'Posterior Chain', sets: 3, reps: '6–8', target: 'Hinge volume', purpose: 'Hamstrings and glutes', notes: 'Controlled lowering.' },
          { id: 'suitcase-carries', name: 'Suitcase Carries', category: 'Core + Grip', sets: 3, reps: '20–40 sec each side', target: 'Carries', purpose: 'Grip and trunk', notes: 'Stay tall.' }
        ]},
        friday: { id: 'TE-B-friday', day: 'friday', type: 'strength', title: 'Carry + Legs Circuit Strength', focus: 'Gym-based tactical work capacity', exercises: [
          { id: 'step-ups', name: 'Weighted Step-ups', category: 'Quads + Glutes', sets: 4, reps: '6–10 each leg', target: 'Step strength', purpose: 'Load carriage legs', notes: 'Use controlled height.' },
          { id: 'farmers-walks', name: 'Farmer’s Walks', category: 'Grip + Core', sets: 4, reps: '40–60 sec', target: 'Carries', purpose: 'Grip, traps and trunk endurance', notes: 'Tall posture.' },
          { id: 'reverse-lunges', name: 'Reverse Lunges', category: 'Quads + Glutes', sets: 3, reps: '6–10 each leg', target: 'Unilateral legs', purpose: 'Knee-friendly leg capacity', notes: 'Smooth reps.' },
          { id: 'hip-abduction', name: 'Hip Abduction / Banded Lateral Walks', category: 'Hip Stability', sets: 3, reps: '12–20', target: 'Hip stability', purpose: 'Knee control', notes: 'Controlled.' },
          { id: 'standing-calf-raises', name: 'Standing Calf Raises', category: 'Calves', sets: 3, reps: '10–15', target: 'Calves', purpose: 'Lower-leg durability', notes: 'Pause at top.' }
        ]}
      }
    }
  }
];

const DEFAULT_STATE = {
  version: APP_VERSION,
  settings: {
    activeCycle: 'A',
    theme: 'tiger',
    fontChoice: 'system',
    customColorsEnabled: false,
    customAccent: '#f97316',
    customAccent2: '#7c3aed',
    customAccent3: '#22c55e',
    weightUnit: 'kg',
    showAddonsInPlan: false,
    activeCardioGoalId: '',
    activeWorkoutProgrammeId: '',
    activeCardioPlanWeek: 1,
    cardioGoalFormDraft: null,
    deloadActive: false,
    deloadIntervalWeeks: 5,
    lastDeloadDate: '',
    insightExerciseId: '',
    insightRangeWeeks: 8,
    deloadOriginalWeights: null,
    deloadFactor: 0.85,
    deloadRounding: 'smart-kg',
    bodyweight: '',
    focusMode: false,
    focusExerciseIndex: 0,
    exerciseSwaps: {},
    skillUpgrades: {},
    skillUpgradeDismissedCounts: {},
    onboardingComplete: false,
    showWarmups: true,
    autoToday: true,
    autoCycle: true,
    autoCycleAnchorDate: todayIso(),
    autoCycleAnchorCycle: 'A',
    lastAutoDaySync: ''
  },
  sessions: [],
  sessionDrafts: {},
  deloads: [],
  cardioGoals: [],
  exerciseMeta: {},
  favourites: [],
  notes: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

let state = loadState();
autoSyncTrainingSchedule(true);
let currentRoute = 'home';
let deferredInstallPrompt = null;

function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
function cycleLabel(cycle) { return CYCLE_LABELS[cycle] || `Week ${cycle}`; }
function otherCycle(cycle) { return cycle === 'A' ? 'B' : 'A'; }
function cycleOptions(selected) { return ['A', 'B'].map(c => `<option value="${c}" ${c === selected ? 'selected' : ''}>${cycleLabel(c)}</option>`).join(''); }
function renderCycleSwitcher(extraClass = '') { return `<div class="cycle-switcher ${extraClass}" aria-label="Training week switcher"><button type="button" class="cycle-pill ${state.settings.activeCycle === 'A' ? 'is-active' : ''}" data-action="set-cycle" data-cycle="A">Week 1</button><button type="button" class="cycle-pill ${state.settings.activeCycle === 'B' ? 'is-active' : ''}" data-action="set-cycle" data-cycle="B">Week 2</button></div>`; }
function esc(value) {
  return String(value ?? '').replace(/[&<>"]/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[match]));
}
function todayIso() { return new Date().toISOString().slice(0, 10); }
function nowIso() { return new Date().toISOString(); }
function niceDate(iso) {
  if (!iso) return 'Not recorded';
  try {
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: iso.includes('T') ? 'short' : undefined }).format(new Date(iso));
  } catch { return iso; }
}
function recentSessions(days = 7) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return state.sessions.filter(session => {
    const time = Date.parse(session.date || session.createdAt || '');
    return Number.isFinite(time) && time >= cutoff;
  });
}
function weeklySummary(days = 7) {
  const recent = recentSessions(days);
  return {
    total: recent.length,
    strength: recent.filter(s => s.type === 'strength').length,
    cardio: recent.filter(s => s.type === 'cardio').length,
    sets: recent.reduce((sum, session) => sum + (session.entries || []).reduce((inner, entry) => inner + (entry.sets || []).filter(set => set.done || set.reps || set.weight || set.duration).length, 0), 0)
  };
}
function uid(prefix = 'id') { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }

function skillProgressionDefinition(exerciseId) { return SKILL_PROGRESSIONS[exerciseId] || null; }
function isSkillUpgradeActive(exerciseId) { return !!state.settings.skillUpgrades?.[exerciseId]; }
function applySkillUpgrade(ex) {
  const definition = skillProgressionDefinition(ex?.id);
  if (!definition || !isSkillUpgradeActive(ex.id)) return ex;
  return { ...ex, ...definition.upgraded, id: ex.id, isSkillUpgraded: true, skillProgressionLabel: definition.label };
}
function progressionEntryQualifies(item, definition) {
  if (!item?.entry?.progressionQuality || item.session?.deload) return false;
  const readinessRaw = item.session?.readiness;
  const readiness = readinessRaw === '' || readinessRaw == null ? NaN : Number(readinessRaw);
  if (Number.isFinite(readiness) && readiness < 3) return false;
  const sets = completedSets(item.entry);
  if (sets.length < definition.minSets) return false;
  const workSets = sets.slice(0, definition.minSets);
  const values = workSets.map(set => { const raw = set[definition.valueType]; return raw === '' || raw == null ? NaN : Number(raw); }).filter(Number.isFinite);
  if (values.length < definition.minSets || values.some(value => value < definition.minValue)) return false;
  const rpes = workSets.map(set => { const raw = set.rpe; return raw === '' || raw == null ? NaN : Number(raw); }).filter(Number.isFinite);
  if (rpes.length < definition.minSets || rpes.some(rpe => rpe > definition.maxRpe)) return false;
  return true;
}
function skillProgressionStatus(exerciseId) {
  const definition = skillProgressionDefinition(exerciseId);
  if (!definition) return null;
  const qualifying = getExerciseEntries(exerciseId).filter(item => progressionEntryQualifies(item, definition));
  const count = qualifying.length;
  const dismissedAtCount = Number(state.settings.skillUpgradeDismissedCounts?.[exerciseId] || 0);
  return {
    exerciseId,
    definition,
    count,
    required: definition.requiredSessions,
    active: isSkillUpgradeActive(exerciseId),
    ready: !isSkillUpgradeActive(exerciseId) && count >= definition.requiredSessions && count > dismissedAtCount,
    dismissedAtCount
  };
}
function allSkillProgressionStatuses() { return Object.keys(SKILL_PROGRESSIONS).map(skillProgressionStatus).filter(Boolean); }
function renderSkillProgressionControl(ex, draftEntry = {}) {
  const status = skillProgressionStatus(ex.id);
  if (!status) return '';
  if (status.active) return `<div class="skill-progress-inline active"><span class="chip good">Skill upgrade active</span><span>${esc(status.definition.label)}</span></div>`;
  const disabled = state.settings.deloadActive ? 'disabled' : '';
  const checked = draftEntry.progressionQuality ? 'checked' : '';
  return `<label class="skill-quality-check ${disabled ? 'is-disabled' : ''}"><input type="checkbox" name="progressionQuality" ${checked} ${disabled}><span><strong>Clean standard met</strong><small>${esc(status.definition.qualityStandard)} Complete all prescribed sets at RPE ${status.definition.maxRpe} or below. ${status.count}/${status.required} qualifying sessions.${disabled ? ' Deload sessions do not count.' : ''}</small></span></label>`;
}
function renderSkillProgressionPanel() {
  const statuses = allSkillProgressionStatuses();
  const ready = statuses.filter(status => status.ready);
  const active = statuses.filter(status => status.active);
  if (!ready.length && !active.length) return '';
  return `<section class="panel skill-progression-panel"><div class="panel-header"><div><p class="eyebrow">Skill progression</p><h3>${ready.length ? 'A controlled upgrade is ready' : 'Active skill upgrades'}</h3><p class="muted small">Tiger never changes an exercise without your approval.</p></div></div><div class="skill-progression-list">
    ${ready.map(status => `<article class="skill-upgrade-card"><div><strong>${esc(status.definition.label)} ready</strong><p class="muted small">${status.count} qualifying sessions completed. Upgrade the exercise prescription now, or keep the current version.</p></div><div class="row-actions compact-actions"><button class="btn btn-small" data-action="accept-skill-upgrade" data-exercise-id="${esc(status.exerciseId)}">Upgrade</button><button class="btn btn-small btn-ghost" data-action="defer-skill-upgrade" data-exercise-id="${esc(status.exerciseId)}">Keep for now</button></div></article>`).join('')}
    ${active.map(status => `<article class="skill-upgrade-card active"><div><strong>${esc(status.definition.upgraded.name)}</strong><p class="muted small">Active in the plan. Your earlier history remains attached to the same exercise.</p></div><button class="btn btn-small btn-ghost" data-action="revert-skill-upgrade" data-exercise-id="${esc(status.exerciseId)}">Use previous version</button></article>`).join('')}
  </div></section>`;
}
function acceptSkillUpgrade(exerciseId) {
  const definition = skillProgressionDefinition(exerciseId);
  if (!definition) return;
  if (!state.settings.skillUpgrades) state.settings.skillUpgrades = {};
  state.settings.skillUpgrades[exerciseId] = true;
  saveState(); render(); toast(`${definition.upgraded.name} added to your plan.`);
}
function deferSkillUpgrade(exerciseId) {
  const status = skillProgressionStatus(exerciseId);
  if (!status) return;
  if (!state.settings.skillUpgradeDismissedCounts) state.settings.skillUpgradeDismissedCounts = {};
  state.settings.skillUpgradeDismissedCounts[exerciseId] = status.count;
  saveState(); render(); toast('Current exercise kept. Tiger will ask again after more qualifying evidence.');
}
function revertSkillUpgrade(exerciseId) {
  const definition = skillProgressionDefinition(exerciseId);
  if (!definition) return;
  if (state.settings.skillUpgrades) delete state.settings.skillUpgrades[exerciseId];
  const status = skillProgressionStatus(exerciseId);
  if (!state.settings.skillUpgradeDismissedCounts) state.settings.skillUpgradeDismissedCounts = {};
  state.settings.skillUpgradeDismissedCounts[exerciseId] = status?.count || 0;
  saveState(); render(); toast('Previous exercise version restored.');
}

function getAllWorkouts() {
  return ['A', 'B'].flatMap(cycle => DAY_ORDER.map(day => { const workout = normaliseWorkoutV148(PLAN[cycle][day]); return { ...workout, exercises: workout.exercises.map(applySkillUpgrade) }; }));
}
function getAllExercises() {
  const map = new Map();
  getAllWorkouts().forEach(workout => workout.exercises.forEach(ex => {
    if (!map.has(ex.id)) map.set(ex.id, ex);
  }));
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}
function isCardioExercise(ex) {
  return !!ex && (ex.category === 'Cardio' || ex.type === 'cardio' || String(ex.id || '').startsWith('active-cardio-'));
}
function getLoadTrackedExercises() {
  return getAllExercises().filter(ex => !isCardioExercise(ex));
}



function standardWorkoutProgrammeTemplate() {
  return {
    id: 'standard',
    title: 'Standard',
    subtitle: 'Two-week strength, varied running, fat-loss conditioning and monster-core plan.',
    badge: 'Default',
    plan: PLAN
  };
}
function allWorkoutProgrammeTemplates() {
  return [standardWorkoutProgrammeTemplate(), ...WORKOUT_PROGRAMME_TEMPLATES];
}

function getWorkoutProgrammeTemplate(id = state.settings.activeWorkoutProgrammeId) {
  if (id === 'standard') return standardWorkoutProgrammeTemplate();
  return WORKOUT_PROGRAMME_TEMPLATES.find(programme => programme.id === id) || null;
}
function activeWorkoutProgrammeTitle() {
  const active = getWorkoutProgrammeTemplate();
  return active ? active.title : 'Standard';
}
function activeTrainingPlan() {
  return getWorkoutProgrammeTemplate()?.plan || PLAN;
}

function getActiveCardioGoal() {
  return (state.cardioGoals || []).find(goal => goal.id === state.settings.activeCardioGoalId) || null;
}
function normaliseCardioPlanWeek(plan, requestedWeek) {
  const total = Number(plan?.weeks || plan?.planRows?.length || 1) || 1;
  return clamp(Number(requestedWeek) || 1, 1, total);
}
function getActiveCardioPlanWeek(plan = getActiveCardioGoal()) {
  return normaliseCardioPlanWeek(plan, state.settings.activeCardioPlanWeek || 1);
}
function getActiveCardioPlanRow(plan = getActiveCardioGoal()) {
  if (!plan || !Array.isArray(plan.planRows) || !plan.planRows.length) return null;
  const week = getActiveCardioPlanWeek(plan);
  return plan.planRows.find(row => Number(row.week) === week) || plan.planRows[week - 1] || plan.planRows[0];
}
function activeCardioWorkout(day) {
  const plan = getActiveCardioGoal();
  const row = getActiveCardioPlanRow(plan);
  if (!plan || !row || !CARDIO_DAYS.includes(day)) return null;
  const week = getActiveCardioPlanWeek(plan);
  const isMonday = day === 'monday';
  const prescription = isMonday ? row.monday : row.wednesday;
  const title = isMonday ? 'Active Plan: Monday Cardio' : 'Active Plan: Wednesday Cardio';
  const name = isMonday ? 'Monday Cardio Session' : 'Wednesday Cardio Session';
  return {
    id: `active-cardio-${day}`,
    day,
    type: 'cardio',
    title,
    focus: `${plan.title} · Plan week ${week}/${plan.weeks}`,
    summary: prescription,
    activeCardioPlanId: plan.id,
    activeCardioPlanWeek: week,
    exercises: [{
      id: `active-cardio-${day}`,
      name,
      category: 'Active Cardio Plan',
      sets: 1,
      reps: '1 session',
      target: prescription,
      purpose: isMonday ? 'Aerobic, progression or gentle hill support for the active running goal' : 'Varied quality work for the active running goal',
      notes: row.notes || 'Follow the active cardio plan. Record speed, distance, duration and RPE.'
    }]
  };
}
function getWorkout(cycle, day) {
  const active = activeCardioWorkout(day);
  if (active) return active;
  const plan = activeTrainingPlan();
  const workout = normaliseWorkoutV148(plan[cycle]?.[day] || PLAN[cycle]?.[day] || PLAN.A.tuesday);
  return { ...workout, exercises: workout.exercises.map(applySkillUpgrade) };
}



function swapKey(cycle, day, originalId) { return `${cycle}-${day}-${originalId}`; }
function getSwapOptions(originalId) { return SUBSTITUTIONS[originalId] || []; }
function effectiveExercise(cycle, day, ex) {
  const originalId = ex.originalId || ex.id;
  const selected = state.settings.exerciseSwaps?.[swapKey(cycle, day, originalId)] || '';
  const match = getSwapOptions(originalId).find(item => item.id === selected);
  if (!match) return { ...ex, originalId, isSwapped: false };
  return { ...ex, ...match, originalId, isSwapped: true, swappedFromName: ex.name, target: ex.target, purpose: ex.purpose, reps: ex.reps, sets: ex.sets };
}
function workoutExercisesForLog(workout, cycle, day) {
  return workout.exercises.map(ex => workout.type === 'cardio' ? ex : effectiveExercise(cycle, day, ex));
}
function isMainLift(ex) { return !!ex && MAIN_LIFT_IDS.has(ex.id); }
function suggestedWarmups(ex, targetWeight) {
  if (!isMainLift(ex)) return [];
  const w = Number(targetWeight);
  if (!Number.isFinite(w) || w <= 0) {
    return [
      { label: 'Light warm-up', percent: '≈40%', weight: 'light', reps: '5–8' },
      { label: 'Moderate warm-up', percent: '≈60%', weight: 'moderate', reps: '3–5' }
    ];
  }
  const step = Number(weightInputStep()) || 1.25;
  const round = v => formatWeight(Math.max(step, roundTo(v, step)));
  if (isBodyweightAddedExercise(ex.id)) {
    return [
      { label: 'Light warm-up', percent: '0% vest', weight: 'bodyweight only', reps: '3–5' },
      { label: 'Moderate warm-up', percent: '≈50% vest', weight: `vest ${round(w * 0.5)}`, reps: '2–3' }
    ];
  }
  return [
    { label: 'Light warm-up', percent: '40%', weight: `${round(w * 0.4)} ${state.settings.weightUnit}`, reps: '5' },
    { label: 'Moderate warm-up', percent: '60%', weight: `${round(w * 0.6)} ${state.settings.weightUnit}`, reps: '3' },
    { label: 'Prep warm-up', percent: '75%', weight: `${round(w * 0.75)} ${state.settings.weightUnit}`, reps: '1–2' }
  ];
}
function renderWarmupBlock(ex, meta) {
  if (!state.settings.showWarmups || !isMainLift(ex)) return '';
  const rows = suggestedWarmups(ex, meta?.manualWeight || '');
  if (!rows.length) return '';
  return `<details class="warmup-block"><summary>Suggested warm-ups <span class="muted tiny">excluded from stats</span></summary><div class="warmup-grid">${rows.map(row => `<div class="warmup-row"><strong>${esc(row.label)}</strong><span>${esc(row.percent)}</span><span>${esc(row.weight)}</span><span>${esc(row.reps)} reps</span></div>`).join('')}</div><p class="muted tiny">Percentages are based on the current exercise weight/vest target.</p></details>`;
}
function renderSwapControl(cycle, day, ex) {
  const originalId = ex.originalId || ex.id;
  const options = getSwapOptions(originalId);
  if (!options.length) return '';
  const selected = state.settings.exerciseSwaps?.[swapKey(cycle, day, originalId)] || '';
  return `<label class="swap-control">Swap if busy<select data-action="swap-exercise" data-cycle="${esc(cycle)}" data-day="${esc(day)}" data-original-id="${esc(originalId)}"><option value="">Original: ${esc(ex.swappedFromName || ex.name)}</option>${options.map(opt => `<option value="${esc(opt.id)}" ${selected === opt.id ? 'selected' : ''}>${esc(opt.name)}</option>`).join('')}</select></label>${ex.isSwapped ? `<div class="mini-alert compact">Swapped from ${esc(ex.swappedFromName)} for this workout slot. Saved logs will use the substitute exercise name.</div>` : ''}`;
}
function focusIndexFor(workout) {
  const max = Math.max(0, (workout.exercises?.length || 1) - 1);
  return Math.min(max, Math.max(0, Number(state.settings.focusExerciseIndex || 0)));
}
function focusProgressText(workout, index) {
  const total = workout.exercises?.length || 1;
  return `Exercise ${index + 1} of ${total}`;
}

function isBodyweightAddedExercise(id) {
  return BODYWEIGHT_ADDED_IDS.has(id);
}
function exerciseLoadLabel(exerciseId) {
  if (exerciseId === 'weighted-pullups') return 'Vest weight';
  if (exerciseId === 'weighted-dips') return 'Added weight';
  return 'Weight';
}
function sumLoad(bodyweight, addedWeight) {
  const bw = Number(bodyweight);
  const add = Number(addedWeight);
  if (!Number.isFinite(bw) && !Number.isFinite(add)) return '';
  const total = (Number.isFinite(bw) ? bw : 0) + (Number.isFinite(add) ? add : 0);
  return total > 0 ? formatWeight(total) : '';
}
function pullupBodyweightValue() {
  const saved = state.settings.bodyweight;
  return saved ?? '';
}
function formatPullupLoad(set, unit = state.settings.weightUnit) {
  const bw = set.bodyweight || '';
  const added = set.addedWeight || '';
  const total = set.systemWeight || set.weight || sumLoad(bw, added);
  if (bw || added) return `BW ${bw || '—'} + added ${added || '0'} = ${total || '—'} ${unit}`;
  return total ? `${total} ${unit} total` : '—';
}
function formatBestSet(best) {
  if (!best) return '—';
  if (best.loadMode === 'bodyweight-added') return `${formatPullupLoad(best, best.unit)} × ${best.reps}`;
  return `${best.weight} ${best.unit} × ${best.reps}`;
}

function dateOnly(value) {
  if (!value) return todayIso();
  return String(value).slice(0, 10);
}
function weekStartIso(value) {
  const d = new Date(`${dateOnly(value)}T12:00:00`);
  if (!Number.isFinite(d.getTime())) return dateOnly(value);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d.toISOString().slice(0, 10);
}
function avg(nums) {
  const clean = nums.map(Number).filter(Number.isFinite);
  return clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : 0;
}
function completedSets(entry) {
  return (entry?.sets || []).filter(set => set.done || set.reps || set.weight || set.duration || set.distance || set.speed);
}
function strengthSets(entry) {
  return completedSets(entry).filter(set => Number.isFinite(Number(set.reps)) && Number(set.reps) > 0);
}
function setVolume(set) {
  const w = Number(set.weight);
  const r = Number(set.reps);
  return Number.isFinite(w) && Number.isFinite(r) ? w * r : 0;
}
function entryVolume(entry) {
  return strengthSets(entry).reduce((sum, set) => sum + setVolume(set), 0);
}
function entryTotalReps(entry) {
  return strengthSets(entry).reduce((sum, set) => sum + (Number(set.reps) || 0), 0);
}
function entryAvgRpe(entry) {
  return avg(completedSets(entry).map(set => set.rpe));
}
function bestSetFromEntry(entry) {
  let best = null;
  strengthSets(entry).forEach(set => {
    const weight = Number(set.weight);
    const reps = Number(set.reps);
    if (!Number.isFinite(weight) || !Number.isFinite(reps)) return;
    const score = weight * (1 + reps / 30);
    if (!best || score > best.score) best = { score, weight, reps, rpe: set.rpe || '', unit: set.unit || state.settings.weightUnit };
  });
  return best;
}
function getExerciseEntries(exerciseId) {
  const out = [];
  state.sessions.forEach(session => {
    (session.entries || []).forEach(entry => {
      if (entry.exerciseId === exerciseId) out.push({ session, entry, date: dateOnly(session.date || session.createdAt), week: weekStartIso(session.date || session.createdAt) });
    });
  });
  return out.sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.session.createdAt || '').localeCompare(String(b.session.createdAt || '')));
}
function formatSetList(entry) {
  const sets = completedSets(entry);
  if (!sets.length) return '—';
  return sets.map((set, i) => {
    if (entry.type === 'cardio' || set.duration || set.speed || set.distance) {
      const bits = [];
      if (set.duration) bits.push(`${set.duration} min`);
      if (set.distance) bits.push(`${set.distance} mi`);
      if (set.speed) bits.push(`${set.speed} mph`);
      if (set.rpe) bits.push(`RPE ${set.rpe}`);
      return bits.join(' · ') || `Set ${i + 1}`;
    }
    const r = set.reps || '—';
    const rpe = set.rpe ? ` @RPE ${set.rpe}` : '';
    if (set.loadMode === 'bodyweight-added' || set.addedWeight || set.bodyweight) {
      return `S${set.set || i + 1}: ${formatPullupLoad(set, set.unit || state.settings.weightUnit)} × ${r}${rpe}`;
    }
    const w = set.weight || '—';
    return `S${set.set || i + 1}: ${w}${set.unit || state.settings.weightUnit} × ${r}${rpe}`;
  }).join('; ');
}
function weekExerciseRows() {
  const rows = [];
  state.sessions.forEach(session => {
    (session.entries || []).forEach(entry => {
      rows.push({ session, entry, week: weekStartIso(session.date || session.createdAt), date: dateOnly(session.date || session.createdAt), exerciseName: entry.exerciseName, exerciseId: entry.exerciseId, totalReps: entryTotalReps(entry), volume: entryVolume(entry), avgRpe: entryAvgRpe(entry), sets: formatSetList(entry) });
    });
  });
  return rows.sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.session.createdAt || '').localeCompare(String(a.session.createdAt || '')));
}
function trendForExercise(exerciseId) {
  const entries = getExerciseEntries(exerciseId).filter(item => item.entry.type !== 'cardio');
  if (entries.length < 2) return { label: 'Baseline needed', tone: 'neutral', detail: 'Log at least two sessions.' };
  const last = entries[entries.length - 1];
  const prev = entries[entries.length - 2];
  const lastBest = bestSetFromEntry(last.entry);
  const prevBest = bestSetFromEntry(prev.entry);
  const lastVol = entryVolume(last.entry);
  const prevVol = entryVolume(prev.entry);
  if (!lastBest || !prevBest) return { label: 'Incomplete data', tone: 'neutral', detail: 'Add weight and reps for clearer trends.' };
  const scoreChange = ((lastBest.score - prevBest.score) / Math.max(prevBest.score, 1)) * 100;
  const volChange = ((lastVol - prevVol) / Math.max(prevVol, 1)) * 100;
  const avgRpeNow = entryAvgRpe(last.entry);
  if (scoreChange >= 2 || (scoreChange >= -1 && volChange >= 8)) return { label: 'Getting stronger', tone: 'positive', detail: `${scoreChange.toFixed(1)}% best-set change; ${volChange.toFixed(0)}% volume change.` };
  if (scoreChange <= -5 || (volChange <= -20 && avgRpeNow >= 8)) return { label: 'Possible fatigue', tone: 'warning', detail: `${scoreChange.toFixed(1)}% best-set change; RPE ${avgRpeNow ? avgRpeNow.toFixed(1) : '—'}.` };
  return { label: 'Stable', tone: 'neutral', detail: `${scoreChange.toFixed(1)}% best-set change; hold and build reps.` };
}
function fatigueStatus() {
  const recent = recentSessions(14);
  const strengthRecent = recent.filter(s => s.type === 'strength');
  const readinessValues = recent.map(s => Number(s.readiness)).filter(Number.isFinite);
  const avgReadiness = readinessValues.length ? avg(readinessValues) : 0;
  const highRpeSets = recent.flatMap(s => s.entries || []).flatMap(e => completedSets(e)).filter(set => Number(set.rpe) >= 9).length;
  const allExercises = getLoadTrackedExercises();
  const fatigueTrends = allExercises.map(ex => trendForExercise(ex.id)).filter(t => t.tone === 'warning').length;
  const lastDeload = state.settings.lastDeloadDate || state.deloads?.[state.deloads.length - 1]?.startDate || '';
  const weeksSinceDeload = lastDeload ? Math.floor((Date.now() - Date.parse(`${lastDeload}T00:00:00`)) / (7 * 24 * 60 * 60 * 1000)) : null;
  const interval = Number(state.settings.deloadIntervalWeeks || 5);
  let status = 'Green';
  let message = 'Train normally. Keep most sets clean and avoid grinding every workout.';
  if (state.settings.deloadActive) {
    status = 'Deload active';
    message = 'Use reduced sets, reduced load and easy RPE this week. Keep the habit; lower the stress.';
  } else if ((weeksSinceDeload !== null && weeksSinceDeload >= interval) || fatigueTrends >= 3 || (avgReadiness && avgReadiness < 2.8) || highRpeSets >= 8) {
    status = 'Deload recommended';
    message = 'Consider a rest/deload week: maintain the routine, reduce load/sets, and avoid hard cardio.';
  } else if (fatigueTrends || highRpeSets >= 4 || (avgReadiness && avgReadiness < 3.3)) {
    status = 'Watch recovery';
    message = 'You may be accumulating fatigue. Hold loads, avoid failure and review sleep/soreness.';
  }
  return { status, message, avgReadiness, highRpeSets, fatigueTrends, weeksSinceDeload, interval, strengthSessions14: strengthRecent.length };
}
function deloadSetCount(sets) {
  return Math.max(1, Math.ceil((Number(sets) || 1) * 0.6));
}
function getDeloadFactor() {
  const n = Number(state.settings.deloadFactor);
  return Number.isFinite(n) && n > 0 && n < 1 ? n : 0.85;
}
function weightInputStep() {
  return state.settings.weightUnit === 'kg' ? '1.25' : '2.5';
}
function roundDownTo(value, step = 1) {
  return Number((Math.floor((Number(value) + 1e-9) / step) * step).toFixed(2));
}
function smartWeightStep(weight) {
  const n = Number(weight);
  if (!Number.isFinite(n) || n <= 0) return state.settings.weightUnit === 'kg' ? 1.25 : 2.5;
  if (state.settings.weightUnit !== 'kg') return n < 50 ? 2.5 : 5;
  if (n < 20) return 1.25;
  if (n < 120) return 2.5;
  return 5;
}
function formatWeight(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return String(Number(n.toFixed(2))).replace(/\.00$/, '');
}
function practicalDeloadWeight(rawTarget, originalWeight) {
  const raw = Number(rawTarget);
  const original = Number(originalWeight);
  if (!Number.isFinite(raw) || raw <= 0) return '';
  const step = smartWeightStep(original || raw);
  let rounded = roundTo(raw, step);
  if (Number.isFinite(original) && original > 0 && rounded >= original) rounded = roundDownTo(raw, step);
  if (Number.isFinite(original) && original > 0 && rounded / original > 0.9) rounded = roundDownTo(raw, step);
  if (rounded <= 0) rounded = step;
  return formatWeight(rounded);
}
function deloadWeight(weight) {
  const n = Number(weight);
  return Number.isFinite(n) && n > 0 ? practicalDeloadWeight(n * getDeloadFactor(), n) : '';
}
function shouldShowDeload() { return !!state.settings.deloadActive; }
function captureDeloadOriginalWeights() {
  const snapshot = {};
  Object.entries(state.exerciseMeta || {}).forEach(([id, meta]) => {
    snapshot[id] = { manualWeight: meta?.manualWeight ?? '' };
  });
  return snapshot;
}
function applyDeloadWeightsFromSnapshot(snapshot) {
  Object.entries(snapshot || {}).forEach(([id, saved]) => {
    const original = saved?.manualWeight ?? '';
    if (!state.exerciseMeta[id]) state.exerciseMeta[id] = { manualWeight: '', notes: '' };
    const reduced = original ? deloadWeight(original) : '';
    state.exerciseMeta[id].manualWeight = reduced;
    if (state.exerciseMeta[id]) state.exerciseMeta[id].deloadRoundedFrom = original ? String(roundTo(Number(original) * getDeloadFactor(), 0.01)) : '';
  });
}
function restoreDeloadOriginalWeights() {
  const snapshot = state.settings.deloadOriginalWeights;
  if (!snapshot || typeof snapshot !== 'object') return false;
  Object.entries(snapshot).forEach(([id, saved]) => {
    if (!state.exerciseMeta[id]) state.exerciseMeta[id] = { manualWeight: '', notes: '' };
    state.exerciseMeta[id].manualWeight = saved?.manualWeight ?? '';
    delete state.exerciseMeta[id].deloadRoundedFrom;
  });
  state.settings.deloadOriginalWeights = null;
  return true;
}
function deloadWeightSummary() {
  const snapshot = state.settings.deloadOriginalWeights;
  if (!snapshot || typeof snapshot !== 'object') return '';
  const changed = Object.values(snapshot).filter(item => item?.manualWeight).length;
  return changed ? `${changed} target weight${changed === 1 ? '' : 's'} temporarily reduced, rounded to practical gym increments, and protected for restore.` : 'No target weights were entered when deload started.';
}

function getCurrentWeekdayKey() {
  const idx = new Date().getDay();
  return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][idx];
}
function getSuggestedDay() {
  const day = getCurrentWeekdayKey();
  if (DAY_ORDER.includes(day)) return day;
  return 'monday';
}

function localDateFromIso(iso) {
  const [y, m, d] = String(iso || todayIso()).split('-').map(Number);
  return new Date(y || new Date().getFullYear(), (m || 1) - 1, d || 1);
}
function wholeWeeksBetween(startIso, endIso = todayIso()) {
  const start = localDateFromIso(startIso);
  const end = localDateFromIso(endIso);
  const startNoon = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 12);
  const endNoon = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 12);
  return Math.max(0, Math.floor((endNoon - startNoon) / (7 * 24 * 60 * 60 * 1000)));
}
function cycleAfterWeeks(anchorCycle, weeksElapsed) {
  const start = anchorCycle === 'B' ? 'B' : 'A';
  return weeksElapsed % 2 === 0 ? start : otherCycle(start);
}
function resetAutoCycleAnchor(cycle = state.settings.activeCycle) {
  state.settings.autoCycleAnchorDate = todayIso();
  state.settings.autoCycleAnchorCycle = cycle === 'B' ? 'B' : 'A';
}
function setActiveCycleManual(cycle) {
  state.settings.activeCycle = cycle === 'B' ? 'B' : 'A';
  state.settings.pendingCycle = state.settings.activeCycle;
  resetAutoCycleAnchor(state.settings.activeCycle);
}
function autoSyncTrainingSchedule(save = false) {
  if (!state?.settings) return false;
  let changed = false;
  const today = todayIso();
  const suggestedDay = getSuggestedDay();

  if (state.settings.autoCycle !== false) {
    if (!state.settings.autoCycleAnchorDate) {
      state.settings.autoCycleAnchorDate = today;
      changed = true;
    }
    if (!state.settings.autoCycleAnchorCycle) {
      state.settings.autoCycleAnchorCycle = state.settings.activeCycle || 'A';
      changed = true;
    }
    const expectedCycle = cycleAfterWeeks(state.settings.autoCycleAnchorCycle, wholeWeeksBetween(state.settings.autoCycleAnchorDate, today));
    if (expectedCycle && state.settings.activeCycle !== expectedCycle) {
      state.settings.activeCycle = expectedCycle;
      if (!state.settings.pendingCycle || state.settings.lastAutoDaySync !== today) state.settings.pendingCycle = expectedCycle;
      changed = true;
    }
  }

  if (state.settings.autoToday !== false && state.settings.lastAutoDaySync !== today) {
    state.settings.pendingDay = suggestedDay;
    state.settings.pendingCycle = state.settings.activeCycle;
    state.settings.lastAutoDaySync = today;
    state.settings.focusExerciseIndex = 0;
    changed = true;
  }

  if (changed && save) saveState();
  return changed;
}
function getExerciseMeta(id) {
  if (!state.exerciseMeta[id]) state.exerciseMeta[id] = { manualWeight: '', notes: '' };
  return state.exerciseMeta[id];
}
let lastStorageErrorAt = 0;
function saveState() {
  try {
    state.updatedAt = nowIso();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('Tiger could not save local data.', error);
    const now = Date.now();
    if (now - lastStorageErrorAt > 3000) {
      lastStorageErrorAt = now;
      if (typeof toast === 'function') toast('Could not save locally. Export a backup and check browser storage.');
    }
    return false;
  }
}
function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const legacyRaw = !raw ? LEGACY_STORAGE_KEYS.map(key => localStorage.getItem(key)).find(Boolean) : null;
  const source = raw || legacyRaw;
  if (!source) {
    return clone(DEFAULT_STATE);
  }
  try {
    const parsed = JSON.parse(source);
    const migrated = migrateState(parsed);
    if (legacyRaw && !raw) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated)); } catch {}
    }
    return migrated;
  } catch {
    return clone(DEFAULT_STATE);
  }
}
function migrateState(parsed) {
  const merged = { ...clone(DEFAULT_STATE), ...parsed };
  merged.settings = { ...clone(DEFAULT_STATE).settings, ...(parsed.settings || {}) };
  merged.sessions = Array.isArray(parsed.sessions) ? parsed.sessions : [];
  merged.sessionDrafts = parsed.sessionDrafts && typeof parsed.sessionDrafts === 'object' ? parsed.sessionDrafts : {};
  merged.cardioGoals = Array.isArray(parsed.cardioGoals) ? parsed.cardioGoals : [];
  merged.deloads = Array.isArray(parsed.deloads) ? parsed.deloads : [];
  merged.exerciseMeta = parsed.exerciseMeta && typeof parsed.exerciseMeta === 'object' ? parsed.exerciseMeta : {};
  merged.favourites = Array.isArray(parsed.favourites) ? parsed.favourites : [];
  merged.version = APP_VERSION;
  return merged;
}
function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2600);
}
function fontOptionsMarkup(selected = 'system') {
  return FONT_OPTIONS.map(f => `<option value="${esc(f.id)}" ${selected === f.id ? 'selected' : ''}>${esc(f.label)}</option>`).join('');
}
function validHexColor(value, fallback) {
  const v = String(value || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback;
}
function applyAppearance() {
  const root = document.documentElement;
  const theme = state.settings.theme || 'tiger';
  root.dataset.theme = theme === 'tiger' ? '' : theme;
  const font = FONT_OPTIONS.find(f => f.id === state.settings.fontChoice) || FONT_OPTIONS[0];
  root.style.setProperty('--font', font.stack);
  if (state.settings.customColorsEnabled) {
    root.style.setProperty('--accent', validHexColor(state.settings.customAccent, '#f97316'));
    root.style.setProperty('--accent-2', validHexColor(state.settings.customAccent2, '#7c3aed'));
    root.style.setProperty('--accent-3', validHexColor(state.settings.customAccent3, '#22c55e'));
  } else {
    root.style.removeProperty('--accent');
    root.style.removeProperty('--accent-2');
    root.style.removeProperty('--accent-3');
  }
}
function setTheme(theme) {
  state.settings.theme = theme || 'tiger';
  applyAppearance();
}
function syncStaticControls() {
  document.querySelectorAll('[data-action="set-cycle"]').forEach(btn => btn.classList.toggle('is-active', btn.dataset.cycle === state.settings.activeCycle));
}

function lastExerciseEntry(exerciseId) {
  for (const session of [...state.sessions].reverse()) {
    const entry = session.entries?.find(e => e.exerciseId === exerciseId);
    if (entry) return { session, entry };
  }
  return null;
}
function bestStrengthSet(exerciseId) {
  let best = null;
  state.sessions.forEach(session => {
    session.entries?.forEach(entry => {
      if (entry.exerciseId !== exerciseId) return;
      entry.sets?.forEach(set => {
        const weight = Number(set.systemWeight || set.weight);
        const reps = Number(set.reps);
        if (!Number.isFinite(weight) || !Number.isFinite(reps) || reps <= 0) return;
        const score = weight * (1 + reps / 30);
        if (!best || score > best.score) best = { score, weight: formatWeight(weight), reps, date: session.date, unit: set.unit || state.settings.weightUnit, bodyweight: set.bodyweight || '', addedWeight: set.addedWeight || '', systemWeight: set.systemWeight || set.weight || '', loadMode: set.loadMode || '' };
      });
    });
  });
  return best;
}
function lastWeightLabel(exerciseId) {
  const meta = getExerciseMeta(exerciseId);
  if (isBodyweightAddedExercise(exerciseId)) {
    const addedTarget = meta.manualWeight || '';
    const bw = pullupBodyweightValue();
    if (addedTarget) {
      const total = sumLoad(bw, addedTarget);
      return `Vest ${addedTarget} ${state.settings.weightUnit} target${bw ? ` · total ${total} ${state.settings.weightUnit}` : ''}`;
    }
    const last = lastExerciseEntry(exerciseId);
    const set = last?.entry?.sets?.find(s => s.addedWeight || s.weight) || last?.entry?.sets?.[0];
    if (!set) return 'No pull-up load logged yet';
    return `${formatPullupLoad(set, set.unit || state.settings.weightUnit)} last used`;
  }
  if (meta.manualWeight) return `${meta.manualWeight} ${state.settings.weightUnit} target`;
  const last = lastExerciseEntry(exerciseId);
  if (!last) return 'No weight logged yet';
  const set = last.entry.sets?.find(s => s.weight) || last.entry.sets?.[0];
  if (!set?.weight) return 'No weight logged yet';
  return `${set.weight} ${set.unit || state.settings.weightUnit} last used`;
}

function sessionDraftKey(cycle, day) { return `${cycle || state.settings.activeCycle}-${day || getSuggestedDay()}`; }
function getSessionDraft(cycle, day) {
  const key = sessionDraftKey(cycle, day);
  return state.sessionDrafts?.[key] || {};
}
function draftExercise(draft, exerciseId) {
  return draft?.entries?.[exerciseId] || {};
}
function draftSetValue(draft, exerciseId, index, name, fallback = '') {
  const value = draftExercise(draft, exerciseId)?.sets?.[index]?.[name];
  return value ?? fallback ?? '';
}
function completedSetCountOnPage() {
  const form = document.getElementById('sessionForm');
  if (!form) return { done: 0, total: 0 };
  const rows = [...form.querySelectorAll('.exercise-card[data-exercise-type="strength"] tbody tr')];
  const done = rows.filter(row => row.querySelector('input[name="done"]')?.checked || row.querySelector('input[name="reps"]')?.value).length;
  return { done, total: rows.length };
}
function updateSessionProgress() {
  const form = document.getElementById('sessionForm');
  if (!form) return;
  const text = document.getElementById('sessionProgressText');
  const bar = document.getElementById('sessionProgressBar');
  const cardioCards = form.querySelectorAll('.exercise-card[data-exercise-type="cardio"]');
  if (cardioCards.length) {
    const completed = [...cardioCards].filter(card => ['duration','distance','speed'].some(name => card.querySelector(`input[name="${name}"]`)?.value)).length;
    if (text) text.textContent = `${completed}/${cardioCards.length} cardio item${cardioCards.length === 1 ? '' : 's'} filled`;
    if (bar) bar.style.width = `${cardioCards.length ? Math.round((completed / cardioCards.length) * 100) : 0}%`;
    return;
  }
  const { done, total } = completedSetCountOnPage();
  if (text) text.textContent = `${done}/${total} strength sets logged`;
  if (bar) bar.style.width = `${total ? Math.round((done / total) * 100) : 0}%`;
}
function compactEntrySummary(exerciseId) {
  const last = lastExerciseEntry(exerciseId);
  if (!last) return 'No previous log';
  const sets = completedSets(last.entry);
  if (!sets.length) return `Last logged ${niceDate(last.session.date || last.session.createdAt)}`;
  if (last.entry.type === 'cardio') {
    const s = sets[0];
    const parts = [];
    if (s.distance) parts.push(`${s.distance} mi`);
    if (s.duration) parts.push(`${s.duration} min`);
    if (s.speed) parts.push(`${s.speed} mph`);
    if (s.rpe) parts.push(`RPE ${s.rpe}`);
    return parts.length ? parts.join(' · ') : 'Cardio logged previously';
  }
  const reps = sets.map(s => s.reps).filter(Boolean).join('/');
  if (isBodyweightAddedExercise(exerciseId)) {
    const s = sets[0];
    return `${formatPullupLoad(s, s.unit || state.settings.weightUnit)} × ${reps || '—'}`;
  }
  const firstWeight = sets.find(s => s.weight)?.weight || '';
  const sameWeight = firstWeight && sets.every(s => !s.weight || String(s.weight) === String(firstWeight));
  if (sameWeight) return `${firstWeight} ${sets[0].unit || state.settings.weightUnit} × ${reps || '—'}`;
  const best = bestSetFromEntry(last.entry);
  return best ? `Best last time: ${best.weight} ${best.unit || state.settings.weightUnit} × ${best.reps}` : `${sets.length} sets logged previously`;
}
function formatTodaysNudge(workout) {
  if (state.settings.deloadActive) return 'Deload mode is active: move well, use lighter targets, keep RPE around 5–6, and leave fresh.';
  const f = fatigueStatus();
  if (f.status === 'Deload soon') return 'Recovery signal is elevated. Train cleanly today and avoid adding extra finishers.';
  if (workout.type === 'cardio') return 'Cardio focus: follow the plan, log speed/distance/RPE, and avoid turning every run into a test.';
  return 'Strength focus: use target loads, log reps honestly, stop before form breaks, then save once at the end.';
}

function restForExercise(ex) {
  if (!ex || ex.category === 'Cardio') return null;
  const id = ex.id;
  if (REST_RULES.mainStrength.includes(id) || MAIN_LIFT_IDS.has(id)) {
    return { seconds: 180, label: '3m', band: 'Heavy strength', note: 'Longer rest helps you keep power, technique and clean reps on main strength work.' };
  }
  if (REST_RULES.secondaryCompound.includes(id)) {
    return { seconds: 120, label: '2m', band: 'Compound / loaded', note: 'Enough recovery for good reps without letting the session drag.' };
  }
  if (REST_RULES.coreAndAccessory.includes(id)) {
    return { seconds: 90, label: '90s', band: 'Accessory / core', note: 'Short-moderate rest keeps quality high without over-resting smaller movements.' };
  }
  if (REST_RULES.prehabLight.includes(id)) {
    return { seconds: 60, label: '60s', band: 'Light accessory / prehab', note: 'These should feel controlled, not like maximal strength sets.' };
  }
  return { seconds: 90, label: '90s', band: 'General strength', note: 'Use this as a sensible default and extend if form drops.' };
}
function restLabel(seconds) {
  const value = Number(seconds) || 0;
  if (value === 60) return '60s';
  if (value === 90) return '90s';
  if (value % 60 === 0) return `${value / 60}m`;
  return `${Math.floor(value / 60)}m ${String(value % 60).padStart(2, '0')}s`;
}
function renderWorkoutRestPanel(workout) {
  if (workout.type === 'cardio') {
    return `<div class="rest-timer-card cardio-rest-note"><span class="muted small">Cardio timing</span><strong>Treadmill clock</strong></div>`;
  }
  return '';
}
function safeDomId(value) {
  return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '-');
}
function renderExerciseRestControls(ex) {
  const rest = restForExercise(ex);
  if (!rest) return '';
  const timerId = safeDomId(ex.id);
  return `<div class="exercise-rest-row compact-exercise-rest"><button type="button" class="btn btn-rest-full" data-action="start-rest-timer" data-seconds="${esc(rest.seconds)}" data-rest-exercise="${esc(ex.name)}" data-rest-target="${esc(timerId)}">Start ${esc(rest.label)} rest</button><div class="exercise-timer-display" data-rest-panel="${esc(timerId)}"><span class="muted tiny">${esc(rest.band)}</span><strong data-rest-output="${esc(timerId)}">—</strong><button type="button" class="btn btn-mini btn-ghost" data-action="stop-rest-timer" data-rest-target="${esc(timerId)}">Stop</button></div></div>`;
}
let restTimerInterval = null;
let activeRestTarget = null;
function resetRestPanels() {
  document.querySelectorAll('[data-rest-panel]').forEach(panel => panel.classList.remove('is-active', 'is-complete'));
  document.querySelectorAll('[data-rest-output]').forEach(output => { output.textContent = '—'; });
}
function startRestTimer(seconds, exerciseName = '', targetId = '') {
  clearInterval(restTimerInterval);
  activeRestTarget = targetId || null;
  resetRestPanels();
  let remaining = Number(seconds) || 120;
  const panel = activeRestTarget ? document.querySelector(`[data-rest-panel="${CSS.escape(activeRestTarget)}"]`) : null;
  const output = activeRestTarget ? document.querySelector(`[data-rest-output="${CSS.escape(activeRestTarget)}"]`) : null;
  if (panel) panel.classList.add('is-active');
  const tick = () => {
    const mins = Math.floor(remaining / 60);
    const secs = String(remaining % 60).padStart(2, '0');
    if (output) output.textContent = `${mins}:${secs}`;
    if (remaining <= 0) {
      clearInterval(restTimerInterval);
      if (output) output.textContent = 'Done';
      if (panel) { panel.classList.remove('is-active'); panel.classList.add('is-complete'); }
      if (navigator.vibrate) navigator.vibrate([150, 80, 150]);
      toast(`${exerciseName || 'Rest'} complete.`);
      return;
    }
    remaining -= 1;
  };
  tick();
  restTimerInterval = setInterval(tick, 1000);
}
function stopRestTimer(targetId = '') {
  clearInterval(restTimerInterval);
  const id = targetId || activeRestTarget;
  if (id) {
    const panel = document.querySelector(`[data-rest-panel="${CSS.escape(id)}"]`);
    const output = document.querySelector(`[data-rest-output="${CSS.escape(id)}"]`);
    if (output) output.textContent = '—';
    if (panel) panel.classList.remove('is-active', 'is-complete');
  } else {
    resetRestPanels();
  }
  activeRestTarget = null;
}

const MORE_ROUTES = new Set(['progress', 'insights', 'cardio-goals', 'settings']);
function routeTo(route) {
  currentRoute = route;
  document.querySelectorAll('.nav-link').forEach(btn => {
    const inBottomNav = !!btn.closest('.bottom-nav');
    const active = btn.dataset.route === route || (inBottomNav && btn.dataset.route === 'more' && MORE_ROUTES.has(route));
    btn.classList.toggle('is-active', active);
  });
  render();
  document.getElementById('app').focus({ preventScroll: true });
  if (window.matchMedia('(max-width: 780px)').matches) window.scrollTo({ top: 0, behavior: 'smooth' });
}

function render() {
  autoSyncTrainingSchedule(true);
  applyAppearance();
  syncStaticControls();
  const app = document.getElementById('app');
  const route = currentRoute;
  document.querySelectorAll('.nav-link').forEach(btn => {
    const inBottomNav = !!btn.closest('.bottom-nav');
    const active = btn.dataset.route === route || (inBottomNav && btn.dataset.route === 'more' && MORE_ROUTES.has(route));
    btn.classList.toggle('is-active', active);
  });
  if (route === 'home') app.innerHTML = renderHome();
  if (route === 'plan') app.innerHTML = renderPlan();
  if (route === 'workouts') app.innerHTML = renderWorkouts();
  if (route === 'log') app.innerHTML = renderLog();
  if (route === 'more') app.innerHTML = renderMore();
  if (route === 'focus') app.innerHTML = renderLog(true);
  if (route === 'progress') app.innerHTML = renderProgress();
  if (route === 'insights') app.innerHTML = renderInsights();
  if (route === 'cardio-goals') app.innerHTML = renderCardioGoals();
  if (route === 'settings') app.innerHTML = renderSettings();
  bindPageEvents();
}


function renderQuickSetupPanel() {
  if (state.settings.onboardingComplete) return '';
  return `<section class="panel setup-panel"><div class="panel-header"><div><p class="eyebrow">Quick setup</p><h3>Quick setup</h3><p class="muted small">Set the basics once. Change them later in Settings.</p></div></div><div class="filter-row"><label>Bodyweight<input id="setupBodyweight" type="number" step="any" min="0" placeholder="${esc(state.settings.weightUnit)}" value="${esc(state.settings.bodyweight || '')}"></label><label>Units<select id="setupUnit"><option value="kg" ${state.settings.weightUnit === 'kg' ? 'selected' : ''}>kg</option><option value="lb" ${state.settings.weightUnit === 'lb' ? 'selected' : ''}>lb</option></select></label><label>Starting week<select id="setupCycle">${cycleOptions(state.settings.activeCycle)}</select></label></div><div class="row-actions"><button type="button" class="btn" data-action="complete-onboarding">Save Quick Setup</button><button type="button" class="btn btn-ghost" data-action="dismiss-onboarding">Skip for now</button></div></section>`;
}

function renderHome() {
  const cycle = state.settings.activeCycle;
  const suggestedDay = getSuggestedDay();
  const workout = getWorkout(cycle, suggestedDay);
  const isCardio = workout.type === 'cardio';
  const dayLabel = DAY_LABELS[suggestedDay] || 'Today';
  const nextLast = workout.exercises?.map(ex => ({ ex, last: compactEntrySummary(ex.id) })) || [];
  return `
    <section class="page compact-home" aria-labelledby="homeTitle">
      ${renderQuickSetupPanel()}
      <section class="hero-card today-focus-card">
        <div class="today-focus-top">
          <div>
            <p class="eyebrow">${esc(cycleLabel(cycle))} · ${esc(dayLabel)}</p>
            <h2 id="homeTitle" class="hero-title">${esc(workout.title)}</h2>
            <p class="hero-text">${esc(workout.focus || workout.summary || '')}</p>
          </div>
          <span class="chip ${isCardio ? 'alt' : 'good'}">${esc(workout.type)}</span>
        </div>
        <div class="hero-actions clean-home-actions">
          <button class="btn btn-large" data-action="log-workout" data-day="${esc(suggestedDay)}" data-cycle="${esc(cycle)}">Start Today's Workout</button>
          ${renderCycleSwitcher('inline-cycle')}
        </div>
      </section>
      <section class="panel today-plan-panel" aria-labelledby="todayPlanTitle">
        <div class="panel-header compact-panel-header">
          <div>
            <p class="eyebrow">Today's focus</p>
            <h3 id="todayPlanTitle">${esc(dayLabel)} plan</h3>
          </div>
          <span class="chip">${workout.exercises.length} item${workout.exercises.length === 1 ? '' : 's'}</span>
        </div>
        ${renderDayEquipmentReminder(workoutExercisesForLog(workout, cycle, suggestedDay))}
        <div class="today-exercise-list">
          ${nextLast.map(({ ex, last }) => `<article class="today-exercise-row"><div><strong>${esc(ex.name)}</strong><small>${esc(ex.sets)} × ${esc(ex.reps)}${ex.category ? ` · ${esc(ex.category)}` : ''}</small></div><span class="chip ghost-chip">${esc(last)}</span></article>`).join('')}
        </div>
      </section>
    </section>`;
}

function renderWorkoutMini(cycle, day) {
  const workout = getWorkout(cycle, day);
  return `<article class="workout-card">
    <p class="eyebrow">${esc(DAY_LABELS[day])}</p>
    <h3>${esc(workout.title)}</h3>
    <div class="workout-meta"><span class="chip ${workout.type === 'cardio' ? 'alt' : 'good'}">${esc(workout.type)}</span><span class="chip">${workout.exercises.length} item${workout.exercises.length === 1 ? '' : 's'}</span></div>
    <p class="muted small">${esc(workout.focus || workout.summary || '')}</p>
    <div class="row-actions"><button class="btn btn-small" data-action="log-workout" data-cycle="${esc(cycle)}" data-day="${esc(day)}">Log</button><button class="btn btn-small btn-ghost" data-action="view-workout" data-cycle="${esc(cycle)}" data-day="${esc(day)}">View</button></div>
  </article>`;
}

function renderPlan() {
  const cycle = state.settings.activeCycle;
  const suggestedDay = getSuggestedDay();
  return `<section class="page plan-page" aria-labelledby="planTitle">
    <div class="toolbar plan-toolbar">
      <div>
        <p class="eyebrow">Programme reference</p>
        <h2 id="planTitle">${esc(cycleLabel(cycle))} training plan</h2>
        <p class="muted">Review the structure here. Active programme: ${esc(activeWorkoutProgrammeTitle())}.</p>
      </div>
      <div class="filter-row">
        ${renderCycleSwitcher()}<label>Week<select id="cycleSelect" class="select-inline">${cycleOptions(cycle)}</select></label>
      </div>
    </div>
    <section class="panel plan-start-panel" aria-label="Plan actions">
      <div>
        <p class="eyebrow">Quick action</p>
        <h3>Ready to train?</h3>
        <p class="muted small">Start a workout from any day below, or jump straight to the suggested day.</p>
      </div>
      <div class="row-actions compact-actions">
        <button class="btn" data-action="log-workout" data-cycle="${esc(cycle)}" data-day="${esc(suggestedDay)}">Start ${esc(DAY_LABELS[suggestedDay])}</button>
        <button class="btn btn-ghost" data-route-jump="log">Open Log</button>
      </div>
    </section>
    ${renderActiveCardioPlanControls(getActiveCardioGoal())}
    <div class="plan-reference-grid">
      ${DAY_ORDER.map(day => renderPlanDayReference(getWorkout(cycle, day), cycle)).join('')}
    </div>
  </section>`;
}
function renderPlanDayReference(workout, cycle = state.settings.activeCycle) {
  const isCardio = workout.type === 'cardio';
  return `<article class="panel plan-day-card" data-workout-id="${esc(workout.id)}">
    <div class="panel-header plan-day-header">
      <div>
        <p class="eyebrow">${esc(DAY_LABELS[workout.day])}</p>
        <h3>${esc(workout.title)}</h3>
        <p class="muted small">${esc(workout.focus || workout.summary || '')}</p>
      </div>
      <span class="chip ${isCardio ? 'alt' : 'good'}">${esc(workout.type)}</span>
    </div>
    ${renderDayEquipmentReminder(workoutExercisesForLog(workout, cycle, workout.day))}
    <div class="row-actions compact-actions plan-day-actions">
      <button class="btn btn-small" data-action="log-workout" data-cycle="${esc(cycle)}" data-day="${esc(workout.day)}">Start This Workout</button>
      ${isCardio ? '<button class="btn btn-small btn-ghost" data-route-jump="cardio-goals">Running Plan</button>' : ''}
    </div>
    <div class="progress-table-wrap plan-table-wrap">
      <table class="progress-table compact-table plan-reference-table">
        <thead><tr><th>Exercise</th><th>Prescription</th><th>Focus</th><th>${isCardio ? 'Timing' : 'Rest'}</th></tr></thead>
        <tbody>${workout.exercises.map(ex => renderPlanExerciseRow(ex, isCardio)).join('')}</tbody>
      </table>
    </div>
    ${renderDailyStretches(workout.day, true)}
  </article>`;
}
function renderPlanExerciseRow(ex, isCardio = false) {
  const rest = isCardio ? 'Treadmill clock' : (restForExercise(ex)?.label || 'As needed');
  const prescription = isCardio ? (ex.target || ex.reps || '1 session') : `${esc(ex.sets)} × ${esc(ex.reps)}`;
  const focus = isCardio ? (ex.notes || ex.purpose || '') : (ex.purpose || ex.target || ex.notes || '');
  return `<tr>
    <td data-label="Exercise"><strong>${esc(ex.name)}</strong><br><span class="muted tiny">${esc(ex.category || ex.target || '')}</span></td>
    <td data-label="Prescription">${isCardio ? esc(prescription) : prescription}</td>
    <td data-label="Focus">${esc(focus)}</td>
    <td data-label="${isCardio ? 'Timing' : 'Rest'}">${esc(rest)}</td>
  </tr>`;
}
function renderWorkoutDetail(workout, expanded = true) {
  return renderPlanDayReference(workout, workout.id?.[0] || state.settings.activeCycle);
}
function renderExerciseCard(ex) {
  return `<article class="exercise-card compact-reference-card"><div class="exercise-title"><h3>${esc(ex.name)}</h3><span class="chip">${esc(ex.sets)} × ${esc(ex.reps)}</span></div><p class="exercise-notes">${esc(ex.purpose || ex.target || ex.notes || '')}</p></article>`;
}


function renderDailyStretches(day, compact = false) {
  const stretches = DAILY_STRETCHES[day] || [];
  if (!stretches.length) return '';
  return `<section class="panel stretch-card ${compact ? 'compact-stretch-card' : ''}" aria-label="After workout stretches">
    <div class="panel-header compact-panel-header">
      <div>
        <p class="eyebrow">After workout</p>
        <h3>Targeted stretches</h3>
        <p class="muted small">Simple cooldown only. Hold each for 20–30 seconds per side, 1–2 rounds.</p>
      </div>
      <span class="chip">${stretches.length} stretch${stretches.length === 1 ? '' : 'es'}</span>
    </div>
    <div class="stretch-list">
      ${stretches.map(stretch => `<article class="stretch-item"><strong>${esc(stretch.name)}</strong><span>${esc(stretch.cue)}</span></article>`).join('')}
    </div>
  </section>`;
}

function renderLog(forceFocus = false) {
  const cycle = state.settings.pendingCycle || state.settings.activeCycle;
  const day = state.settings.pendingDay || getSuggestedDay();
  const workout = getWorkout(cycle, day);
  const draft = getSessionDraft(cycle, day);
  const draftDate = draft.date || todayIso();
  const focusActive = forceFocus || !!state.settings.focusMode;
  const focusIndex = focusIndexFor(workout);
  const logExercises = workoutExercisesForLog(workout, cycle, day);
  return `<section class="page" aria-labelledby="logTitle">
    <div class="toolbar">
      <div>
        <p class="eyebrow">Workout cockpit</p>
        <h2 id="logTitle">${esc(DAY_LABELS[day])}: ${esc(workout.title)}</h2>
        <p class="muted">Today is selected automatically. Use the override controls only when logging a different workout.</p>
      </div>
      <div class="filter-row log-override-row">
        ${renderCycleSwitcher()}<label>Week<select id="logCycleSelect" class="select-inline">${cycleOptions(cycle)}</select></label>
        <label>Day<select id="logDaySelect" class="select-inline">${DAY_ORDER.map(d => `<option value="${esc(d)}" ${d === day ? 'selected' : ''}>${esc(DAY_LABELS[d])}</option>`).join('')}</select></label>
      </div>
    </div>
    <form id="sessionForm" novalidate class="panel session-form ${focusActive ? 'focus-mode-form' : ''}" data-cycle="${esc(cycle)}" data-day="${esc(day)}" data-focus-active="${focusActive ? 'true' : 'false'}">
      ${renderDeloadNotice(workout)}
      ${renderDayEquipmentReminder(logExercises)}
      <div class="log-top-actions" role="region" aria-label="Workout quick controls">
        <button class="btn btn-ghost" type="button" data-action="prefill-last">Use Last Values</button>
        ${focusActive ? '' : '<button class="btn btn-soft" type="button" data-action="toggle-focus">Start Focus Mode</button>'}
      </div>
      ${renderFocusControls(workout, focusActive, focusIndex)}
      <div class="filter-row session-meta-row">
        <label>Date<input type="date" name="date" value="${esc(draftDate)}"></label>
        <label>Readiness / energy<input type="number" name="readiness" min="1" max="5" step="1" inputmode="numeric" placeholder="1–5" value="${esc(draft.readiness || '')}"></label>
        <label>Session notes<input type="text" name="sessionNotes" placeholder="Energy, sleep, form notes, anything useful" value="${esc(draft.sessionNotes || '')}"></label>
      </div>
      <div class="exercise-list">
        ${logExercises.map((ex, index) => workout.type === 'cardio' ? renderCardioLogExercise(ex, draft, focusActive, index, focusIndex) : renderStrengthLogExercise(ex, draft, cycle, day, focusActive, index, focusIndex)).join('')}
      </div>
      ${renderDailyStretches(day)}
      <div id="sessionValidation" class="form-validation" role="alert" aria-live="assertive" hidden></div>
      <div class="row-actions save-workout-footer">
        <button class="btn btn-save-primary" type="submit">Save Workout</button>
      </div>
    </form>
  </section>`;
}

function renderFocusControls(workout, focusActive, focusIndex) {
  if (!focusActive) {
    return '';
  }
  const total = workout.exercises?.length || 1;
  const current = workout.exercises?.[focusIndex];
  return `<div class="focus-control-card"><div><p class="eyebrow">Focus Mode</p><h3>${esc(current?.name || 'Current exercise')}</h3><p class="muted small">${esc(focusProgressText(workout, focusIndex))}</p></div><div class="row-actions compact-actions"><button type="button" class="btn btn-ghost" data-action="focus-prev" ${focusIndex <= 0 ? 'disabled' : ''}>Previous</button><button type="button" class="btn btn-soft" data-action="focus-next" ${focusIndex >= total - 1 ? 'disabled' : ''}>Next Exercise</button><button type="button" class="btn" data-action="toggle-focus">Exit Focus</button></div></div>`;
}

function formCueForExercise(ex) {
  if (ex?.formCue) return ex.formCue;
  const cues = {
    'bench-smith-press': 'Set shoulders, brace, lower under control, press evenly.',
    'smith-squat': 'Brace, squat vertically, control depth, keep knees tracking cleanly.',
    'leg-press': 'Use controlled depth, keep feet planted, avoid hard knee lockout.',
    'incline-press': 'Keep shoulder blades set and press through a controlled range.',
    'decline-press': 'Control the descent and keep shoulders comfortable throughout.',
    'weighted-dips': 'Stay controlled, keep shoulders comfortable, use a clean range.',
    'rope-pulldown': 'Keep elbows steady, extend fully, return under control.',
    'ez-french-press': 'Keep elbows stable and use a smooth range that feels good.',
    'flyes': 'Use a controlled stretch and keep a soft bend in the elbows.',
    'face-pulls': 'Pull to face level, rotate gently, keep shoulders down.',
    'external-rotations': 'Keep elbow position steady and move slowly.',
    'rollouts': 'Brace hard, avoid lower-back sagging, return under control.',
    'paused-rollouts': 'Brace hard, pause only while the lower back stays neutral.',
    'standing-rollouts': 'Brace hard and stop at the deepest clean standing range.',
    'standing-rollout-progression': 'Lock the ribs down, squeeze glutes and use only a range you can reverse cleanly.',
    'hollow-body-hold': 'Flatten the lower back, reach long and stop before the back lifts.',
    'long-lever-plank': 'Brace hard, squeeze glutes and pull elbows toward toes without moving.',
    'l-sit-hold': 'Press shoulders down, lock elbows and lift from the hips without swinging.',
    'weighted-hanging-leg-raises': 'Start still, raise without momentum and lower the weight slowly.',
    'dragon-flag-eccentrics': 'Keep the body rigid and lower only through a range you can control.',
    'sled-push-finisher': 'Drive through the floor with a braced trunk and smooth, powerful steps.',
    'air-bike-intervals': 'Build output smoothly and keep the hard repetitions repeatable.',
    'battle-rope-intervals': 'Brace the torso, keep shoulders down and sustain clean waves.',
    'kneeling-rollouts': 'Reach long from the knees, keep ribs down, and return under control.',
    'weighted-pullups': 'Start from control, pull cleanly, avoid swinging or half reps.',
    'trap-bar-deadlift': 'Brace before the pull, drive through the floor, keep reps crisp.',
    'barbell-row': 'Hinge and brace, row without jerking, keep torso controlled.',
    'cable-row': 'Sit tall, pull elbows back, control the return.',
    'one-arm-db-row': 'Brace, row toward the hip, avoid twisting through the torso.',
    'db-curls': 'Keep elbows close, wrists neutral, and lift without swinging.',
    'farmers-walks': 'Stand tall, ribs down, walk slowly without leaning.',
    'suitcase-carries': 'Stay tall and resist leaning toward the weight.',
    'kettlebell-walks': 'Stand tall, grip firmly, walk under control.',
    'hanging-leg-raises': 'Control the hang, raise without swinging, lower slowly.',
    'pallof-press': 'Brace and resist rotation; move slowly.',
    'shoulder-press-machine': 'Brace, press evenly, avoid excessive lower-back arch.',
    'db-shoulder-press': 'Brace, keep ribs down, press evenly overhead.',
    'reverse-flyes': 'Lead with the elbows, hold briefly, keep shoulders down.',
    'lateral-raises': 'Lift smoothly to the side without swinging.',
    'bulgarian-split-squat': 'Use a stable setup, stay balanced, control the descent.',
    'reverse-lunges': 'Step back under control and keep the front foot planted.',
    'single-leg-rdl': 'Hinge slowly, keep hips controlled, let the weight track with the rear leg.',
    'seated-leg-curl': 'Set the pad firmly and curl through a controlled range.',
    'kettlebell-swings': 'Hinge, snap the hips, keep the back neutral.',
    'standing-calf-raises': 'Pause at the top and lower slowly.',
    'hip-abduction': 'Move from the hips and keep the torso still.',
    'tibialis-raises': 'Lift toes under control and avoid rushing reps.'
  };
  return cues[ex.id] || ex.notes || 'Use controlled form and stop the set if technique breaks.';
}

function renderDeloadNotice(workout) {
  if (!state.settings.deloadActive) return '';
  const isCardio = workout.type === 'cardio';
  return `<div class="deload-banner"><div><strong>Deload / rest week active</strong><p>${isCardio ? 'Keep cardio easy: reduce duration by roughly 20–30%, avoid target-pace tests, and finish fresh.' : 'Tiger has temporarily reduced your saved target weights, shows fewer set rows, and will restore your normal targets when deload finishes. Keep RPE 5–6 and avoid failure.'}</p></div><button type="button" class="btn btn-soft" data-action="finish-deload">Finish Deload</button></div>`;
}

function renderStrengthLogExercise(ex, draft = {}, cycle = state.settings.activeCycle, day = getSuggestedDay(), focusActive = false, index = 0, focusIndex = 0) {
  const meta = getExerciseMeta(ex.id);
  const activeDeload = shouldShowDeload();
  const visibleSets = activeDeload ? deloadSetCount(ex.sets) : (Number(ex.sets) || 1);
  const draftEntry = draftExercise(draft, ex.id);
  const lastSummary = compactEntrySummary(ex.id);
  if (isBodyweightAddedExercise(ex.id)) return renderBodyweightAddedLogExercise(ex, meta, activeDeload, visibleSets, draft, cycle, day, focusActive, index, focusIndex);
  const suggestedWeight = meta.manualWeight || draftSetValue(draft, ex.id, 0, 'weight', '');
  const exerciseRpe = draftEntry.sessionRpe || draftSetValue(draft, ex.id, 0, 'rpe', '');
  const originalWeight = state.settings.deloadOriginalWeights?.[ex.id]?.manualWeight || '';
  const deloadHint = activeDeload ? `<div class="mini-alert">Deload target active: ${originalWeight ? `normal ${esc(originalWeight)} ${esc(state.settings.weightUnit)} → deload ${esc(meta.manualWeight || '')} ${esc(state.settings.weightUnit)}. ` : ''}Keep RPE 5–6.</div>` : '';
  const restControls = renderExerciseRestControls(ex);
  const warmups = renderWarmupBlock(ex, meta);
  const swapControls = renderSwapControl(cycle, day, ex);
  const coachSuggestion = renderLoadCoach(meta);
  const focusClass = focusActive ? (index === focusIndex ? ' is-focus-active' : ' is-focus-hidden') : '';
  return `<article class="exercise-card compact-log-card${focusClass}" data-exercise-id="${esc(ex.id)}" data-exercise-name="${esc(ex.name)}" data-exercise-type="strength">
    <div class="exercise-top">
      <div>
        <div class="exercise-title"><h3>${esc(ex.name)}</h3><span class="chip">${esc(ex.sets)} × ${esc(ex.reps)}</span><span class="chip alt">${esc(ex.category)}</span></div>
        <p class="exercise-notes form-cue">${esc(formCueForExercise(ex))}</p>${deloadHint}${coachSuggestion}${warmups}${swapControls}
        <div class="exercise-quickbar"><span class="chip alt">Last: ${esc(lastSummary)}</span><button type="button" class="btn btn-mini" data-action="prefill-exercise" data-exercise-id="${esc(ex.id)}">Use last</button><button type="button" class="btn btn-mini btn-soft" data-action="mark-exercise-done" data-exercise-id="${esc(ex.id)}">Mark done</button></div>${restControls}
      </div>
      <div class="target-stack compact-load-stack">
        <label class="select-inline">Weight<input data-meta-weight="${esc(ex.id)}" type="number" min="0" step="any" inputmode="decimal" placeholder="${esc(state.settings.weightUnit)}" value="${esc(suggestedWeight)}"></label>
        <label class="select-inline">RPE<input type="number" step="0.5" min="1" max="10" name="exerciseRpe" inputmode="decimal" placeholder="1–10" value="${esc(exerciseRpe)}"></label>
      </div>
    </div>
    ${renderSetTargetChip(ex)}
    ${renderStrengthSetTable(ex, visibleSets, draft)}
    ${renderSkillProgressionControl(ex, draftEntry)}
    <label class="small exercise-notes-field">Exercise notes<textarea name="exerciseNotes" rows="2" placeholder="Form, setup, discomfort">${esc(draftEntry.notes ?? meta.notes ?? '')}</textarea></label>
  </article>`;
}
function renderBodyweightAddedLogExercise(ex, meta, activeDeload, visibleSets, draft = {}, cycle = state.settings.activeCycle, day = getSuggestedDay(), focusActive = false, index = 0, focusIndex = 0) {
  const bodyweight = draftSetValue(draft, ex.id, 0, 'bodyweight', pullupBodyweightValue());
  const addedTarget = draftSetValue(draft, ex.id, 0, 'addedWeight', meta.manualWeight || '');
  const total = sumLoad(bodyweight, addedTarget);
  const draftEntry = draftExercise(draft, ex.id);
  const exerciseRpe = draftEntry.sessionRpe || draftSetValue(draft, ex.id, 0, 'rpe', '');
  const lastSummary = compactEntrySummary(ex.id);
  const originalWeight = state.settings.deloadOriginalWeights?.[ex.id]?.manualWeight || '';
  const deloadHint = activeDeload ? `<div class="mini-alert">Deload added weight target active: ${originalWeight ? `normal ${esc(originalWeight)} ${esc(state.settings.weightUnit)} → deload ${esc(addedTarget)} ${esc(state.settings.weightUnit)}. ` : ''}Keep RPE 5–6.</div>` : '';
  const restControls = renderExerciseRestControls(ex);
  const warmups = renderWarmupBlock(ex, meta);
  const swapControls = renderSwapControl(cycle, day, ex);
  const coachSuggestion = renderLoadCoach(meta);
  const focusClass = focusActive ? (index === focusIndex ? ' is-focus-active' : ' is-focus-hidden') : '';
  return `<article class="exercise-card compact-log-card${focusClass}" data-exercise-id="${esc(ex.id)}" data-exercise-name="${esc(ex.name)}" data-exercise-type="strength" data-load-mode="bodyweight-added">
    <div class="exercise-top">
      <div>
        <div class="exercise-title"><h3>${esc(ex.name)}</h3><span class="chip">${esc(ex.sets)} × ${esc(ex.reps)}</span><span class="chip alt">${esc(bodyweightAddedModeLabel(ex))}</span></div>
        <p class="exercise-notes form-cue">${esc(formCueForExercise(ex))}</p>${deloadHint}${coachSuggestion}${warmups}${swapControls}
        <div class="exercise-quickbar"><span class="chip alt">Last: ${esc(lastSummary)}</span><button type="button" class="btn btn-mini" data-action="prefill-exercise" data-exercise-id="${esc(ex.id)}">Use last</button><button type="button" class="btn btn-mini btn-soft" data-action="mark-exercise-done" data-exercise-id="${esc(ex.id)}">Mark done</button></div>${restControls}
      </div>
      <div class="target-stack compact-load-stack pullup-load-stack">
        <label class="select-inline">Bodyweight<input data-bodyweight-setting type="number" min="0" step="any" inputmode="decimal" placeholder="${esc(state.settings.weightUnit)}" value="${esc(bodyweight)}"></label>
        <label class="select-inline">${esc(bodyweightAddedLabel(ex))}<input data-meta-weight="${esc(ex.id)}" type="number" min="0" step="any" inputmode="decimal" placeholder="${esc(state.settings.weightUnit)}" value="${esc(addedTarget)}"></label>
        <label class="select-inline">RPE<input type="number" step="0.5" min="1" max="10" name="exerciseRpe" inputmode="decimal" placeholder="1–10" value="${esc(exerciseRpe)}"></label>
        <div class="load-total-chip">Total <strong class="exercise-total-load-output">${esc(total || '—')}</strong> ${esc(state.settings.weightUnit)}</div>
      </div>
    </div>
    ${renderSetTargetChip(ex)}
    ${renderStrengthSetTable(ex, visibleSets, draft)}
    ${renderSkillProgressionControl(ex, draftEntry)}
    <label class="small exercise-notes-field">Exercise notes<textarea name="exerciseNotes" rows="2" placeholder="Form, grip, range">${esc(draftEntry.notes ?? meta.notes ?? '')}</textarea></label>
  </article>`;
}

function renderCardioLogExercise(ex, draft = {}, focusActive = false, index = 0, focusIndex = 0) {
  const draftEntry = draftExercise(draft, ex.id);
  const first = draftEntry.sets?.[0] || {};
  const lastSummary = compactEntrySummary(ex.id);
  const focusClass = focusActive ? (index === focusIndex ? ' is-focus-active' : ' is-focus-hidden') : '';
  return `<article class="exercise-card${focusClass}" data-exercise-id="${esc(ex.id)}" data-exercise-name="${esc(ex.name)}" data-exercise-type="cardio">
    <div class="exercise-top">
      <div>
        <div class="exercise-title"><h3>${esc(ex.name)}</h3><span class="chip">${esc(ex.target)}</span></div>
        <p class="exercise-notes">${esc(ex.notes)}</p>
        <div class="exercise-quickbar"><span class="chip alt">Last: ${esc(lastSummary)}</span><button type="button" class="btn btn-mini" data-action="prefill-exercise" data-exercise-id="${esc(ex.id)}">Use last</button></div>
      </div>
    </div>
    <div class="filter-row">
      <label>Duration minutes<input type="number" min="0" step="1" name="duration" inputmode="numeric" value="${esc(first.duration || '')}"></label>
      <label>Distance miles<input type="number" min="0" step="0.01" name="distance" inputmode="decimal" value="${esc(first.distance || '')}"></label>
      <label>Average speed mph<input type="number" min="0" step="0.1" name="speed" inputmode="decimal" value="${esc(first.speed || '')}"></label>
      <label>Perceived effort / RPE<input type="number" min="1" max="10" step="0.5" name="rpe" inputmode="decimal" value="${esc(first.rpe || '')}"></label>
    </div>
    <label>Cardio notes<input type="text" name="exerciseNotes" placeholder="How it felt, incline, treadmill, breathing" value="${esc(draftEntry.notes || '')}"></label>
  </article>`;
}
function renderProgress() {
  const allExercises = getLoadTrackedExercises();
  const recent = [...state.sessions].reverse().slice(0, 8);
  return `<section class="page" aria-labelledby="progressTitle">
    <div class="toolbar">
      <div>
        <p class="eyebrow">Progress</p>
        <h2 id="progressTitle">Current weights and history</h2>
        <p class="muted">Your strength exercise weights, notes and recent history.</p>
      </div>
      <div class="row-actions"><button class="btn btn-ghost" data-action="export-csv">Export CSV</button><button class="btn" data-action="download-backup">Backup JSON</button></div>
    </div>

    ${renderSkillProgressionPanel()}

    <section class="panel">
      <label class="search-label">Find exercise<input id="exerciseSearch" type="search" placeholder="Search weights, notes or categories" autocomplete="off"></label>
    </section>

    <section class="panel">
      <div class="panel-header"><h3>Current exercise weights</h3><span class="chip">${allExercises.length} strength exercises</span></div>
      <div class="progress-table-wrap">
        <table class="progress-table">
          <thead><tr><th>Exercise</th><th>Category</th><th>Trend</th><th>Current weight</th><th>Last logged</th><th>Suggested next move</th><th>Best set</th><th>Notes</th></tr></thead>
          <tbody>${allExercises.map(ex => renderProgressRow(ex)).join('')}</tbody>
        </table>
      </div>
    </section>

    ${renderWeeklySetTracker()}

    <section class="panel">
      <div class="panel-header"><h3>Recent sessions</h3><span class="chip">${state.sessions.length} total</span></div>
      <div class="list">
        ${recent.length ? recent.map(session => renderHistoryItem(session)).join('') : '<p class="muted">No sessions logged yet. Start with today’s workout.</p>'}
      </div>
    </section>
  </section>`;
}
function renderProgressRow(ex) {
  const meta = getExerciseMeta(ex.id);
  const last = lastExerciseEntry(ex.id);
  const best = bestStrengthSet(ex.id);
  const lastSet = last?.entry?.sets?.find(s => s.weight || s.reps || s.addedWeight) || last?.entry?.sets?.[0];
  const lastLabel = lastSet ? (isBodyweightAddedExercise(ex.id) ? `${formatPullupLoad(lastSet, lastSet.unit || state.settings.weightUnit)} × ${lastSet.reps || '—'} on ${niceDate(last.session.date)}` : `${lastSet.weight || '—'} ${lastSet.unit || state.settings.weightUnit} × ${lastSet.reps || '—'} on ${niceDate(last.session.date)}`) : '—';
  const bestLabel = formatBestSet(best);
  const targetPlaceholder = isBodyweightAddedExercise(ex.id) ? `Vest ${state.settings.weightUnit}` : state.settings.weightUnit;
  return `<tr data-exercise-id="${esc(ex.id)}">
    <td><strong>${esc(ex.name)}</strong></td>
    <td>${esc(ex.category)}</td>
    <td>${renderTrendChip(trendForExercise(ex.id))}</td>
    <td><input data-meta-weight="${esc(ex.id)}" type="number" min="0" step="any" inputmode="decimal" value="${esc(meta.manualWeight || '')}" placeholder="${esc(targetPlaceholder)}"><small class="muted">${isBodyweightAddedExercise(ex.id) ? 'Added load only' : ''}</small></td>
    <td>${esc(lastLabel)}</td>
    <td>${esc(nextMoveLabel(ex, last?.entry))}</td>
    <td>${esc(bestLabel)}</td>
    <td><input data-meta-notes="${esc(ex.id)}" type="text" value="${esc(meta.notes || '')}" placeholder="Setup, cues, notes"></td>
  </tr>`;
}

function renderTrendChip(trend) {
  const klass = trend.tone === 'positive' ? 'trend-good' : trend.tone === 'warning' ? 'trend-warn' : 'trend-neutral';
  return `<span class="trend-chip ${klass}" title="${esc(trend.detail)}">${esc(trend.label)}</span>`;
}
function renderRecoveryDashboard() {
  const f = fatigueStatus();
  const statusClass = f.status === 'Green' ? 'trend-good' : f.status === 'Watch recovery' ? 'trend-neutral' : 'trend-warn';
  const weeks = f.weeksSinceDeload === null ? 'No deload logged yet' : `${f.weeksSinceDeload} week(s) since last deload`;
  return `<section class="panel recovery-panel">
    <div class="panel-header"><div><h3>Recovery and rest-week check</h3><p class="muted">Uses reps, loads, RPE and readiness to flag fatigue.</p></div><span class="trend-chip ${statusClass}">${esc(f.status)}</span></div>
    <p>${esc(f.message)}</p>
    ${state.settings.deloadActive ? `<p class="muted small"><strong>Weight restore:</strong> ${esc(deloadWeightSummary())}</p>` : ''}
    <div class="metric-grid compact-metrics">
      <div class="metric-card"><div class="metric-value">${f.avgReadiness ? f.avgReadiness.toFixed(1) : '—'}</div><div class="metric-label">Avg readiness, 14 days</div></div>
      <div class="metric-card"><div class="metric-value">${f.highRpeSets}</div><div class="metric-label">High-RPE sets, 14 days</div></div>
      <div class="metric-card"><div class="metric-value">${f.fatigueTrends}</div><div class="metric-label">Exercises trending down</div></div>
      <div class="metric-card"><div class="metric-value">${esc(weeks)}</div><div class="metric-label">Rest-week timing</div></div>
    </div>
    <div class="row-actions"><button class="btn" data-action="activate-deload">Activate Deload Week</button><button class="btn btn-soft" data-action="finish-deload">Finish Deload</button><button class="btn btn-ghost" data-action="log-deload">Log Deload Marker</button></div>
    <details class="guidance-details"><summary>When should I take a rest/deload week?</summary><ul><li>Plan one every 4–6 hard training weeks, especially when strength work and running both feel demanding.</li><li>Take one sooner if the same lifts drop for two exposures, readiness is low, RPE feels unusually high, sleep is poor, or joints feel beaten up.</li><li>Keep the routine: go to the gym, use the same movement patterns, but do fewer sets, lower load and stop well before failure.</li></ul></details>
  </section>`;
}
function renderWeeklySetTracker() {
  const rows = weekExerciseRows().slice(0, 80);
  return `<section class="panel">
    <div class="panel-header"><div><h3>Weekly per-set tracker</h3><p class="muted">Latest logged sets by exercise.</p></div><span class="chip">${state.sessions.length} sessions</span></div>
    <div class="progress-table-wrap">
      <table class="progress-table set-history-table"><thead><tr><th>Date</th><th>Week of</th><th>Day</th><th>Exercise</th><th>Sets completed</th><th>Total reps</th><th>Volume</th><th>Avg RPE</th></tr></thead><tbody>
      ${rows.length ? rows.map(row => `<tr><td>${esc(niceDate(row.date))}</td><td>${esc(niceDate(row.week))}</td><td>${esc(DAY_LABELS[row.session.day] || row.session.day)}</td><td><strong>${esc(row.exerciseName)}</strong></td><td>${esc(row.sets)}</td><td>${row.totalReps || '—'}</td><td>${row.volume ? `${Math.round(row.volume)} ${state.settings.weightUnit} reps` : '—'}</td><td>${row.avgRpe ? row.avgRpe.toFixed(1) : '—'}</td></tr>`).join('') : '<tr><td colspan="8">No set history yet. Log a workout first.</td></tr>'}
      </tbody></table>
    </div>
  </section>`;
}

function parseRepRange(reps) {
  const text = String(reps || '');
  const nums = text.match(/\d+/g)?.map(Number) || [];
  if (!nums.length) return null;
  return { low: nums[0], high: nums[1] || nums[0] };
}
function nextMoveLabel(ex, entry) {
  if (!entry || ex.category === 'Cardio') return 'Log a baseline';
  const target = parseRepRange(ex.reps);
  const completed = (entry.sets || []).filter(set => set.done || set.reps || set.weight);
  if (!completed.length) return 'Log a baseline';
  const reps = completed.map(set => Number(set.reps)).filter(Number.isFinite);
  const weights = completed.map(set => Number(set.weight)).filter(Number.isFinite);
  if (!target || !reps.length || !weights.length) return 'Hold and refine form';
  const minReps = Math.min(...reps);
  const allAtTop = reps.length >= Number(ex.sets || reps.length) && minReps >= target.high;
  const manyLow = reps.filter(r => r < target.low).length >= Math.ceil(reps.length / 2);
  if (allAtTop && isBodyweightAddedExercise(ex.id)) return `Consider +${state.settings.weightUnit === 'kg' ? '1.25–2.5 kg' : '2.5–5 lb'} added load next time`;
  if (allAtTop) return `Consider +${state.settings.weightUnit === 'kg' ? '1–2.5 kg' : '2.5–5 lb'} next time`;
  if (manyLow) return 'Hold or reduce slightly';
  return 'Hold weight; add reps';
}


function getWeekRange(count = 8) {
  const base = new Date(`${weekStartIso(todayIso())}T12:00:00`);
  return Array.from({ length: count }, (_, index) => {
    const d = new Date(base);
    d.setDate(base.getDate() - (count - 1 - index) * 7);
    const iso = d.toISOString().slice(0, 10);
    return { week: iso, label: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(d) };
  });
}
function weeklyInsightRows(count = 8) {
  const rows = getWeekRange(count).map(w => ({ ...w, volume: 0, reps: 0, sets: 0, highRpe: 0, readinessValues: [], cardioMinutes: 0, cardioDistance: 0, cardioSpeedValues: [], cardioRpeValues: [] }));
  const byWeek = new Map(rows.map(row => [row.week, row]));
  state.sessions.forEach(session => {
    const row = byWeek.get(weekStartIso(session.date || session.createdAt));
    if (!row) return;
    const readiness = Number(session.readiness);
    if (Number.isFinite(readiness)) row.readinessValues.push(readiness);
    (session.entries || []).forEach(entry => {
      completedSets(entry).forEach(set => {
        const rpe = Number(set.rpe);
        if (Number.isFinite(rpe) && rpe >= 9) row.highRpe += 1;
        if (entry.type === 'cardio') {
          const duration = Number(set.duration);
          const distance = Number(set.distance);
          const speed = Number(set.speed);
          const cardioRpe = Number(set.rpe);
          if (Number.isFinite(duration)) row.cardioMinutes += duration;
          if (Number.isFinite(distance)) row.cardioDistance += distance;
          if (Number.isFinite(speed)) row.cardioSpeedValues.push(speed);
          if (Number.isFinite(cardioRpe)) row.cardioRpeValues.push(cardioRpe);
          return;
        }
        const reps = Number(set.reps);
        if (Number.isFinite(reps) && reps > 0) {
          row.reps += reps;
          row.sets += 1;
          row.volume += setVolume(set);
        }
      });
    });
  });
  return rows.map(row => ({
    ...row,
    volume: Math.round(row.volume),
    readiness: row.readinessValues.length ? roundTo(avg(row.readinessValues), 0.1) : 0,
    cardioSpeed: row.cardioSpeedValues.length ? roundTo(avg(row.cardioSpeedValues), 0.1) : 0,
    cardioRpe: row.cardioRpeValues.length ? roundTo(avg(row.cardioRpeValues), 0.1) : 0,
    cardioMinutes: Math.round(row.cardioMinutes),
    cardioDistance: roundTo(row.cardioDistance, 0.1)
  }));
}
function exerciseInsightRows(exerciseId) {
  return getExerciseEntries(exerciseId).filter(item => item.entry.type !== 'cardio').slice(-14).map(item => {
    const best = bestSetFromEntry(item.entry);
    return {
      date: item.date,
      label: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(`${item.date}T12:00:00`)),
      volume: Math.round(entryVolume(item.entry)),
      reps: entryTotalReps(item.entry),
      bestScore: best ? roundTo(best.score, 0.1) : 0,
      bestLabel: best ? `${best.weight}${best.unit || state.settings.weightUnit} × ${best.reps}` : '—',
      rpe: roundTo(entryAvgRpe(item.entry), 0.1)
    };
  });
}
function cardioInsightRows() {
  const rows = [];
  state.sessions.forEach(session => {
    (session.entries || []).forEach(entry => {
      if (entry.type !== 'cardio') return;
      completedSets(entry).forEach(set => {
        rows.push({
          date: dateOnly(session.date || session.createdAt),
          label: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(`${dateOnly(session.date || session.createdAt)}T12:00:00`)),
          exercise: entry.exerciseName,
          duration: Number(set.duration) || 0,
          distance: Number(set.distance) || 0,
          speed: Number(set.speed) || 0,
          rpe: Number(set.rpe) || 0
        });
      });
    });
  });
  return rows.sort((a, b) => String(a.date).localeCompare(String(b.date))).slice(-16);
}
function recordsData() {
  const strength = [];
  getAllExercises().filter(ex => ex.category !== 'Cardio').forEach(ex => {
    const best = bestStrengthSet(ex.id);
    if (best) strength.push({ exercise: ex.name, category: ex.category, weight: best.weight, reps: best.reps, unit: best.unit, date: best.date, score: best.score });
  });
  strength.sort((a, b) => b.score - a.score);
  const cardio = cardioInsightRows();
  const fastest = [...cardio].filter(r => r.speed).sort((a, b) => b.speed - a.speed)[0];
  const longest = [...cardio].filter(r => r.distance).sort((a, b) => b.distance - a.distance)[0];
  const mostTime = [...cardio].filter(r => r.duration).sort((a, b) => b.duration - a.duration)[0];
  return { strength, fastest, longest, mostTime };
}
function insightSignal() {
  const rows = weeklyInsightRows(6);
  const last = rows[rows.length - 1] || {};
  const prev = rows[rows.length - 2] || {};
  const volumeDrop = prev.volume > 0 && last.volume < prev.volume * 0.8;
  const highRpe = last.highRpe >= 4;
  const readinessLow = last.readiness && last.readiness < 3;
  if (state.settings.deloadActive) return { label: 'Deload active', tone: 'warning', detail: 'Keep the routine, lower the stress, and use the week to freshen up.' };
  if (volumeDrop && (highRpe || readinessLow)) return { label: 'Deload soon', tone: 'warning', detail: 'Recent volume is down while effort/recovery markers look strained.' };
  if (highRpe || readinessLow) return { label: 'Watch recovery', tone: 'neutral', detail: 'Performance may still be fine, but effort/recovery markers deserve attention.' };
  return { label: 'Training well', tone: 'positive', detail: 'No obvious fatigue pattern from recent logged data.' };
}
function renderMiniChart({ title, description, data, metrics, kind = 'line', empty = 'Log more sessions to draw this chart.' }) {
  const usable = (data || []).filter(row => metrics.some(metric => Number.isFinite(Number(row[metric.key])) && Number(row[metric.key]) !== 0));
  if (!usable.length) return `<article class="chart-card"><h3>${esc(title)}</h3><p class="muted small">${esc(description)}</p><div class="empty-chart">${esc(empty)}</div></article>`;
  const width = 680;
  const height = 260;
  const left = 44;
  const right = 18;
  const top = 26;
  const bottom = 42;
  const max = Math.max(...usable.flatMap(row => metrics.map(metric => Number(row[metric.key]) || 0)), 1);
  const xFor = index => usable.length === 1 ? left + (width - left - right) / 2 : left + index * ((width - left - right) / (usable.length - 1));
  const yFor = value => top + (height - top - bottom) * (1 - ((Number(value) || 0) / max));
  const grid = [0, .25, .5, .75, 1].map(frac => {
    const y = top + (height - top - bottom) * frac;
    return `<line class="chart-grid-line" x1="${left}" y1="${y}" x2="${width - right}" y2="${y}"></line>`;
  }).join('');
  const seriesSvg = metrics.map((metric, mi) => {
    if (kind === 'bar') {
      const barGroupWidth = (width - left - right) / usable.length;
      const barWidth = Math.max(8, Math.min(28, barGroupWidth / (metrics.length + 1)));
      return usable.map((row, index) => {
        const value = Number(row[metric.key]) || 0;
        const x = xFor(index) - (barWidth * metrics.length / 2) + mi * barWidth;
        const y = yFor(value);
        return `<rect class="chart-bar chart-series-${mi}" x="${x}" y="${y}" width="${barWidth - 2}" height="${height - bottom - y}" rx="5"><title>${esc(row.label)} · ${esc(metric.label)}: ${esc(formatInsightValue(value, metric))}</title></rect>`;
      }).join('');
    }
    const points = usable.map((row, index) => `${roundTo(xFor(index), .1)},${roundTo(yFor(Number(row[metric.key]) || 0), .1)}`).join(' ');
    const dots = usable.map((row, index) => {
      const value = Number(row[metric.key]) || 0;
      return `<circle class="chart-dot chart-series-${mi}" cx="${xFor(index)}" cy="${yFor(value)}" r="4"><title>${esc(row.label)} · ${esc(metric.label)}: ${esc(formatInsightValue(value, metric))}</title></circle>`;
    }).join('');
    return `<polyline class="chart-line chart-series-${mi}" points="${points}"></polyline>${dots}`;
  }).join('');
  const labels = usable.map((row, index) => {
    if (usable.length > 8 && index % 2) return '';
    return `<text class="chart-x-label" x="${xFor(index)}" y="${height - 15}" text-anchor="middle">${esc(row.label)}</text>`;
  }).join('');
  const legend = metrics.map((metric, i) => `<span class="legend-item"><span class="legend-swatch chart-series-bg-${i}"></span>${esc(metric.label)}</span>`).join('');
  return `<article class="chart-card"><div class="chart-card-header"><div><h3>${esc(title)}</h3><p class="muted small">${esc(description)}</p></div><div class="chart-legend">${legend}</div></div><svg class="insight-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}">${grid}<line class="chart-axis" x1="${left}" y1="${height - bottom}" x2="${width - right}" y2="${height - bottom}"></line><line class="chart-axis" x1="${left}" y1="${top}" x2="${left}" y2="${height - bottom}"></line>${seriesSvg}${labels}</svg></article>`;
}
function formatInsightValue(value, metric = {}) {
  if (!Number.isFinite(Number(value))) return '—';
  const suffix = metric.suffix || '';
  const prefix = metric.prefix || '';
  return `${prefix}${roundTo(Number(value), metric.step || 0.1)}${suffix}`;
}
function renderInsights() {
  const allStrength = getAllExercises().filter(ex => ex.category !== 'Cardio');
  const selected = state.settings.insightExerciseId && allStrength.some(ex => ex.id === state.settings.insightExerciseId) ? state.settings.insightExerciseId : (allStrength[0]?.id || '');
  state.settings.insightExerciseId = selected;
  const range = Number(state.settings.insightRangeWeeks || 8);
  const weekly = weeklyInsightRows(range);
  const exRows = selected ? exerciseInsightRows(selected) : [];
  const exName = allStrength.find(ex => ex.id === selected)?.name || 'Exercise';
  const cardioRows = cardioInsightRows();
  const signal = insightSignal();
  const records = recordsData();
  const totalVolume = weekly.reduce((sum, row) => sum + row.volume, 0);
  const totalCardio = weekly.reduce((sum, row) => sum + row.cardioDistance, 0);
  return `<section class="page" aria-labelledby="insightsTitle">
    <div class="toolbar">
      <div>
        <p class="eyebrow">Insights</p>
        <h2 id="insightsTitle">Graphs and training signals</h2>
        <p class="muted">Visualise your logged sets, running, RPE and readiness so you can see progress and spot fatigue earlier.</p>
      </div>
      <div class="filter-row">
        <label>Range<select id="insightRangeSelect" class="select-inline"><option value="6" ${range === 6 ? 'selected' : ''}>6 weeks</option><option value="8" ${range === 8 ? 'selected' : ''}>8 weeks</option><option value="12" ${range === 12 ? 'selected' : ''}>12 weeks</option></select></label>
        <button class="btn btn-ghost" data-route-jump="log">Log workout</button>
      </div>
    </div>
    <div class="metric-grid">
      <div class="metric-card"><div class="metric-value">${esc(state.sessions.length)}</div><div class="metric-label">Sessions logged</div></div>
      <div class="metric-card"><div class="metric-value">${esc(totalVolume)}</div><div class="metric-label">Strength volume in range</div></div>
      <div class="metric-card"><div class="metric-value">${esc(roundTo(totalCardio, 0.1))}</div><div class="metric-label">Cardio miles in range</div></div>
      <div class="metric-card"><div class="metric-value">${renderTrendChip(signal)}</div><div class="metric-label">Current signal</div></div>
    </div>
    <section class="insight-grid">
      ${renderMiniChart({ title: 'Weekly strength volume', description: 'Estimated volume from weight × reps across logged strength sets.', data: weekly, metrics: [{ key: 'volume', label: 'Volume', suffix: ` ${state.settings.weightUnit} reps`, step: 1 }], kind: 'bar' })}
      ${renderMiniChart({ title: 'Weekly reps and high-RPE sets', description: 'Total reps completed compared with sets logged at RPE 9 or higher.', data: weekly, metrics: [{ key: 'reps', label: 'Total reps', step: 1 }, { key: 'highRpe', label: 'High-RPE sets', step: 1 }], kind: 'line' })}
    </section>
    <section class="panel">
      <div class="panel-header"><div><h3>Exercise trend</h3><p class="muted small">Choose one exercise to see whether weight/reps/volume are moving in the right direction.</p></div><label>Exercise<select id="insightExerciseSelect" class="select-inline">${allStrength.map(ex => `<option value="${esc(ex.id)}" ${ex.id === selected ? 'selected' : ''}>${esc(ex.name)}</option>`).join('')}</select></label></div>
      <div class="insight-grid tight-grid">
        ${renderMiniChart({ title: `${exName}: volume`, description: 'Logged weight × reps for this exercise over time.', data: exRows, metrics: [{ key: 'volume', label: 'Volume', suffix: ` ${state.settings.weightUnit} reps`, step: 1 }], kind: 'bar' })}
        ${renderMiniChart({ title: `${exName}: best-set score and RPE`, description: 'Best-set score estimates strength trend; RPE shows how hard it felt.', data: exRows, metrics: [{ key: 'bestScore', label: 'Best-set score', step: 0.1 }, { key: 'rpe', label: 'Avg RPE', step: 0.1 }], kind: 'line' })}
      </div>
    </section>
    <section class="insight-grid">
      ${renderMiniChart({ title: 'Cardio speed trend', description: 'Average logged speed by cardio session. Use alongside RPE, not in isolation.', data: cardioRows, metrics: [{ key: 'speed', label: 'Speed', suffix: ' mph', step: 0.1 }], kind: 'line' })}
      ${renderMiniChart({ title: 'Cardio distance and RPE', description: 'Distance shows endurance exposure; RPE shows whether the work is becoming easier or harder.', data: cardioRows, metrics: [{ key: 'distance', label: 'Distance', suffix: ' mi', step: 0.1 }, { key: 'rpe', label: 'RPE', step: 0.1 }], kind: 'line' })}
    </section>
    <section class="insight-grid">
      ${renderMiniChart({ title: 'Readiness trend', description: 'Average readiness score from logged sessions by week.', data: weekly, metrics: [{ key: 'readiness', label: 'Readiness', step: 0.1 }], kind: 'line' })}
      <article class="chart-card">
        <div class="chart-card-header"><div><h3>Records</h3><p class="muted small">Best logged strength and cardio markers.</p></div></div>
        <div class="records-list">
          ${records.strength.slice(0, 8).map(item => `<div class="record-row"><span><strong>${esc(item.exercise)}</strong><small>${esc(item.category)} · ${esc(niceDate(item.date))}</small></span><b>${esc(item.loadMode === 'bodyweight-added' ? `${formatPullupLoad(item, item.unit)} × ${item.reps}` : `${item.weight} ${item.unit} × ${item.reps}`)}</b></div>`).join('') || '<p class="muted">Log strength sets with weight and reps to build records.</p>'}
          <div class="record-row"><span><strong>Fastest run</strong><small>${records.fastest ? `${esc(records.fastest.exercise)} · ${esc(niceDate(records.fastest.date))}` : 'No cardio logged'}</small></span><b>${records.fastest ? `${esc(records.fastest.speed)} mph` : '—'}</b></div>
          <div class="record-row"><span><strong>Longest run</strong><small>${records.longest ? `${esc(records.longest.exercise)} · ${esc(niceDate(records.longest.date))}` : 'No cardio logged'}</small></span><b>${records.longest ? `${esc(records.longest.distance)} mi` : '—'}</b></div>
          <div class="record-row"><span><strong>Longest duration</strong><small>${records.mostTime ? `${esc(records.mostTime.exercise)} · ${esc(niceDate(records.mostTime.date))}` : 'No cardio logged'}</small></span><b>${records.mostTime ? `${esc(records.mostTime.duration)} min` : '—'}</b></div>
        </div>
      </article>
    </section>
  </section>`;
}


function roundTo(value, step = 0.1) {
  return Number((Math.round(value / step) * step).toFixed(2));
}
function clamp(num, min, max) {
  return Math.min(max, Math.max(min, num));
}
function milesFrom(value, unit) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return unit === 'km' ? n * 0.621371 : n;
}
function mphFrom(value, unit) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return unit === 'kph' ? n * 0.621371 : n;
}
function milesToDisplay(miles, unit = 'mi') {
  if (!Number.isFinite(miles) || miles <= 0) return '—';
  if (unit === 'km') return `${roundTo(miles / 0.621371, 0.1)} km`;
  return `${roundTo(miles, 0.1)} miles`;
}
function speedToDisplay(mph, unit = 'mph') {
  if (!Number.isFinite(mph) || mph <= 0) return '—';
  if (unit === 'kph') return `${roundTo(mph / 0.621371, 0.1)} kph`;
  return `${roundTo(mph, 0.1)} mph`;
}
function paceLabel(mph) {
  if (!Number.isFinite(mph) || mph <= 0) return '—';
  const minPerMile = 60 / mph;
  const minutes = Math.floor(minPerMile);
  const seconds = Math.round((minPerMile - minutes) * 60).toString().padStart(2, '0');
  const minPerKm = minPerMile * 0.621371;
  const kmMinutes = Math.floor(minPerKm);
  const kmSeconds = Math.round((minPerKm - kmMinutes) * 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}/mile · ${kmMinutes}:${kmSeconds}/km`;
}
function targetTimeLabel(distanceMiles, speedMph) {
  if (!distanceMiles || !speedMph) return '—';
  const minutes = distanceMiles / speedMph * 60;
  const whole = Math.floor(minutes);
  const seconds = Math.round((minutes - whole) * 60).toString().padStart(2, '0');
  return `${whole}:${seconds}`;
}
function determineGoalWeeks(goal) {
  if (goal.timeline !== 'auto') return Number(goal.timeline);
  const targetMinutes = goal.targetMiles / goal.targetMph * 60;
  const distanceGap = Math.max(0, goal.targetMiles - goal.currentBenchmarkMiles);
  const speedGap = Math.max(0, goal.targetMph - goal.currentBenchmarkMph);
  const isComfortGoal = goal.targetMiles <= goal.currentBenchmarkMiles * 1.05 && goal.targetMph <= goal.currentBenchmarkMph * 1.03;
  if (isComfortGoal) return 8;
  const estimate = 8 + distanceGap * 3.2 + speedGap * 6 + Math.max(0, targetMinutes - 30) * 0.22;
  return clamp(Math.round(estimate / 2) * 2, 8, 28);
}
function buildPlanRows(goal, weeks, phaseName = '', startWeek = 1) {
  const targetMinutes = goal.targetMiles / goal.targetMph * 60;
  const longRunTarget = clamp(Math.max(goal.currentEasyMinutes, targetMinutes * 1.35, goal.targetMiles > 5 ? 75 : 65), 45, goal.targetMiles > 5 ? 90 : 75);
  const targetSpeed = goal.targetMph;
  const startWorkSpeed = clamp(Math.min(targetSpeed - 0.5, goal.currentBenchmarkMph * 0.96), 5, targetSpeed);
  return Array.from({ length: weeks }, (_, i) => {
    const localWeek = i + 1;
    const week = startWeek + i;
    const progress = weeks === 1 ? 1 : i / (weeks - 1);
    const deload = localWeek % 4 === 0 && localWeek !== weeks;
    const easyDuration = Math.round((goal.currentEasyMinutes + (longRunTarget - goal.currentEasyMinutes) * progress) / 5) * 5;
    const displayedEasyDuration = deload ? Math.max(35, Math.round(easyDuration * 0.8 / 5) * 5) : easyDuration;
    const easySpeed = roundTo(Math.min(goal.currentEasyMph + 0.25 * progress, Math.max(goal.currentEasyMph, targetSpeed - 1.0)), 0.1);
    const steadySpeed = roundTo(Math.min(targetSpeed - 0.5, easySpeed + 0.3), 0.1);
    const workSpeed = roundTo(startWorkSpeed + (targetSpeed - startWorkSpeed) * progress, 0.1);
    const pattern = (localWeek - 1) % 8;

    let monday = '';
    if (deload) {
      monday = `Recovery run ${displayedEasyDuration} min at ${speedToDisplay(easySpeed, goal.speedUnit)}; keep it conversational`;
    } else if (pattern === 0) {
      monday = `Easy run ${Math.max(35, displayedEasyDuration - 5)} min at ${speedToDisplay(easySpeed, goal.speedUnit)} + 4–6 × 20 sec relaxed strides`;
    } else if (pattern === 1 || pattern === 5) {
      monday = `Long easy run ${displayedEasyDuration} min at ${speedToDisplay(easySpeed, goal.speedUnit)}`;
    } else if (pattern === 2 || pattern === 6) {
      const finish = clamp(Math.round(displayedEasyDuration * 0.22 / 5) * 5, 10, 20);
      monday = `Progression run: ${displayedEasyDuration - finish} min easy at ${speedToDisplay(easySpeed, goal.speedUnit)} + ${finish} min steady at ${speedToDisplay(steadySpeed, goal.speedUnit)}`;
    } else if (pattern === 4) {
      monday = `Aerobic hill run ${Math.max(40, displayedEasyDuration - 10)} min easy including 6 × 45 sec at 2–4% incline; jog easy between`;
    } else {
      monday = `Aerobic fartlek ${Math.max(40, displayedEasyDuration - 5)} min: easy running with 8 × 1 min steady at ${speedToDisplay(steadySpeed, goal.speedUnit)} / 2 min easy`;
    }

    let wedsTitle = '';
    let wedsWork = '';
    let wedsNotes = '';
    if (deload) {
      wedsTitle = 'Recovery consolidation';
      wedsWork = `25–35 min easy at ${speedToDisplay(goal.currentEasyMph, goal.speedUnit)} + 4 × 20 sec relaxed strides`;
      wedsNotes = 'Reduce fatigue, keep the legs moving and protect the following strength sessions.';
    } else if (localWeek === weeks) {
      wedsTitle = 'Controlled goal check';
      wedsWork = `${milesToDisplay(goal.targetMiles, goal.distanceUnit)} at ${speedToDisplay(targetSpeed, goal.speedUnit)} if readiness is good; otherwise 2 × ${Math.max(8, Math.round(targetMinutes / 2))} min at target pace`;
      wedsNotes = 'Treat this as a controlled assessment rather than an all-out race. Record RPE and repeat later if the pace is not yet sustainable.';
    } else if (pattern === 0) {
      const reps = goal.targetMiles > 5 ? 8 : 6;
      wedsTitle = 'Hill repeats';
      wedsWork = `${reps} × 60–75 sec at 4–6% incline, 75–90 sec easy recovery; then 10 min steady at ${speedToDisplay(Math.min(workSpeed, steadySpeed + 0.2), goal.speedUnit)}`;
      wedsNotes = 'Use a controlled incline and repeatable effort. Avoid hard downhill running.';
    } else if (pattern === 1) {
      const reps = goal.targetMiles > 5 ? 4 : 3;
      const minutes = goal.targetMiles > 5 ? 8 : 6 + Math.round(progress * 4);
      wedsTitle = 'Cruise intervals';
      wedsWork = `${reps} × ${minutes} min at ${speedToDisplay(workSpeed, goal.speedUnit)}, 2–3 min easy recovery`;
      wedsNotes = 'Finish feeling that one more repetition would have been possible.';
    } else if (pattern === 2) {
      const block = clamp(Math.round((18 + progress * 16) / 2) * 2, 18, 34);
      wedsTitle = 'Tempo run';
      wedsWork = goal.targetMiles > 5 ? `2 × ${Math.round(block / 2)} min at ${speedToDisplay(workSpeed, goal.speedUnit)}, 3 min easy between` : `${block} min continuous at ${speedToDisplay(workSpeed, goal.speedUnit)}`;
      wedsNotes = 'Comfortably hard and controlled. No sprint finish is required.';
    } else if (pattern === 4) {
      wedsTitle = 'Hill + interval combination';
      wedsWork = `12–15 min hill block: 6 × 60 sec at 4–6% incline, then 3 × 5 min at ${speedToDisplay(workSpeed, goal.speedUnit)} with 2 min easy`;
      wedsNotes = 'Keep both blocks submaximal. The combination provides variety without turning either section into a test.';
    } else if (pattern === 5) {
      const reps = goal.targetMiles > 5 ? 8 : 6;
      wedsTitle = 'Fartlek';
      wedsWork = `${reps} × 2 min strong at ${speedToDisplay(workSpeed, goal.speedUnit)} / 2 min easy float`;
      wedsNotes = 'Run by rhythm and relaxed form. Strong does not mean sprinting.';
    } else if (pattern === 6) {
      const reps = goal.targetMiles > 5 ? 3 : 2;
      const minutes = Math.max(10, Math.round((targetMinutes * 0.32 + progress * targetMinutes * 0.15) / 2) * 2);
      wedsTitle = 'Target-pace consolidation';
      wedsWork = `${reps} × ${minutes} min at ${speedToDisplay(Math.min(targetSpeed, workSpeed), goal.speedUnit)}, 3 min easy recovery`;
      wedsNotes = 'Practise goal pace in controlled chunks before attempting it continuously.';
    } else {
      wedsTitle = 'Tempo + speed finish';
      wedsWork = `20–25 min at ${speedToDisplay(Math.min(workSpeed, targetSpeed - 0.1), goal.speedUnit)} + 6 × 1 min at ${speedToDisplay(targetSpeed, goal.speedUnit)} / 1 min easy`;
      wedsNotes = 'Keep the tempo smooth, then use short fast repetitions for speed reserve.';
    }
    return { week, phase: phaseName, monday, wednesday: `${wedsTitle}: ${wedsWork}`, notes: wedsNotes };
  });
}
function buildSingleCardioGoalPlan(goal) {
  const weeks = determineGoalWeeks(goal);
  const targetMinutes = goal.targetMiles / goal.targetMph * 60;
  const rows = buildPlanRows(goal, weeks, '', 1);
  return {
    ...goal,
    planType: 'single',
    weeks,
    targetMinutes,
    planRows: rows,
    guidance: 'Single-target plan with a rotating mix of easy runs, long runs, progression runs, hills, cruise intervals, tempo work, fartlek and combined sessions. Monday stays mostly aerobic; Wednesday carries the main quality load.',
    createdAt: nowIso(),
    id: goal.id || uid('cardio-goal')
  };
}
function buildStagedCardioGoalPlan(goal) {
  const primary = { ...goal, timeline: 'auto' };
  const secondary = {
    ...goal,
    targetDistance: goal.secondaryTargetDistance,
    targetSpeed: goal.secondaryTargetSpeed,
    targetMiles: goal.secondaryTargetMiles,
    targetMph: goal.secondaryTargetMph,
    currentBenchmarkDistance: goal.targetDistance,
    currentBenchmarkSpeed: goal.targetSpeed,
    currentBenchmarkMiles: goal.targetMiles,
    currentBenchmarkMph: goal.targetMph,
    currentBenchmarkRpe: Math.min(7, Number(goal.currentBenchmarkRpe || 8)),
    currentEasyMinutes: Math.max(goal.currentEasyMinutes, Math.round((goal.targetMiles / goal.targetMph * 60) * 1.25 / 5) * 5),
    timeline: 'auto'
  };
  const autoPhase1 = clamp(determineGoalWeeks(primary), 6, 10);
  const autoPhase2 = clamp(determineGoalWeeks(secondary), 10, 28);
  let phase1Weeks = autoPhase1;
  let phase2Weeks = autoPhase2;
  if (goal.timeline !== 'auto') {
    const total = Number(goal.timeline);
    phase1Weeks = clamp(Math.round(total * 0.35), 4, 10);
    phase2Weeks = Math.max(4, total - phase1Weeks);
  }
  const phase1Rows = buildPlanRows(primary, phase1Weeks, 'Phase 1: consolidate first goal', 1);
  const phase2Rows = buildPlanRows(secondary, phase2Weeks, 'Phase 2: extend to bigger goal', phase1Weeks + 1);
  const harderInBoth = secondary.targetMiles >= primary.targetMiles && secondary.targetMph >= primary.targetMph;
  const compatibility = harderInBoth
    ? 'Good staged combination: the second target is both longer and faster, so Tiger treats the first goal as a stepping stone rather than running two separate hard plans at once.'
    : 'Mixed-goal combination: Tiger still phases the targets, but avoid adding another hard run unless recovery is excellent.';
  const weeks = phase1Weeks + phase2Weeks;
  return {
    ...goal,
    planType: 'staged',
    weeks,
    targetMinutes: secondary.targetMiles / secondary.targetMph * 60,
    planRows: [...phase1Rows, ...phase2Rows],
    guidance: `${compatibility} The plan rotates easy, progression, hill, interval, tempo, fartlek and mixed sessions while keeping Monday mostly aerobic and Wednesday as the main quality day.`,
    createdAt: nowIso(),
    id: goal.id || uid('cardio-goal')
  };
}
function buildCardioGoalPlan(goal) {
  if (goal.useSecondGoal && goal.secondaryTargetMiles && goal.secondaryTargetMph) return buildStagedCardioGoalPlan(goal);
  return buildSingleCardioGoalPlan(goal);
}
function defaultCardioGoal() {
  return {
    title: '',
    targetDistance: '',
    distanceUnit: 'mi',
    targetSpeed: '',
    speedUnit: 'mph',
    currentEasySpeed: '',
    currentEasyMinutes: '',
    currentBenchmarkDistance: '',
    currentBenchmarkSpeed: '',
    currentBenchmarkRpe: '',
    useSecondGoal: false,
    secondaryTargetDistance: '',
    secondaryTargetSpeed: '',
    timeline: 'auto'
  };
}

function cardioGoalFormDefaults() {
  return defaultCardioGoal();
}
function checkedAttr(value) { return value ? 'checked' : ''; }
function selectedAttr(value, expected) { return String(value) === String(expected) ? 'selected' : ''; }
function renderActiveCardioPlanControls(active) {
  if (!active) return '';
  const week = getActiveCardioPlanWeek(active);
  const row = getActiveCardioPlanRow(active);
  return `<section class="panel active-cardio-control-panel"><div class="panel-header"><div><p class="eyebrow">Applied running plan</p><h3>${esc(active.title)}</h3></div><span class="chip alt">Applied</span></div><div class="active-cardio-week-control"><button class="btn btn-small btn-ghost" data-action="cardio-plan-prev-week">Previous week</button><label>Plan week<input id="activeCardioPlanWeekInput" type="number" min="1" max="${esc(active.weeks)}" step="1" value="${esc(week)}"></label><button class="btn btn-small btn-ghost" data-action="cardio-plan-next-week">Next week</button></div>${row ? `<div class="active-plan-week-preview"><div><strong>Monday</strong><span>${esc(row.monday)}</span></div><div><strong>Wednesday</strong><span>${esc(row.wednesday)}</span></div></div>` : ''}</section>`;
}

function renderWorkoutProgrammePreview(programme) {
  const plan = programme.plan;
  const rows = ['A', 'B'].map(cycle => `<div class="programme-week-preview"><strong>${esc(cycleLabel(cycle))}</strong>${DAY_ORDER.map(day => {
    const workout = plan[cycle]?.[day];
    return workout ? `<span class="programme-day-row"><b>${esc(DAY_LABELS[day])}</b><em>${esc(workout.title)}</em></span>` : '';
  }).join('')}</div>`).join('');
  return `<div class="programme-preview-grid">${rows}</div>`;
}
function renderWorkouts() {
  const activeId = state.settings.activeWorkoutProgrammeId || 'standard';
  return `<section class="page workouts-page" aria-labelledby="workoutsTitle">
    <div class="toolbar">
      <div>
        <p class="eyebrow">Workout Library</p>
        <h2 id="workoutsTitle">Workouts</h2>
      </div>
    </div>

    <section class="panel">
      <div class="programme-card-grid">
        ${allWorkoutProgrammeTemplates().map(programme => {
          const isActive = activeId === programme.id;
          return `<article class="exercise-card programme-card ${isActive ? 'is-active-plan' : ''}">
            <div class="exercise-top">
              <div>
                <div class="exercise-title"><h3>${esc(programme.title)}</h3><span class="chip alt">${esc(programme.badge)}</span>${isActive ? '<span class="chip good">Active</span>' : ''}</div>
                <p class="exercise-notes">${esc(programme.subtitle)}</p>
              </div>
              <div class="card-actions">
                <button class="btn btn-small" type="button" data-action="apply-workout-programme" data-programme-id="${esc(programme.id)}">${isActive ? 'Active' : 'Apply'}</button>
              </div>
            </div>
            ${renderWorkoutProgrammePreview(programme)}
          </article>`;
        }).join('')}
      </div>
    </section>
  </section>`;
}
function applyWorkoutProgramme(id) {
  if (id === 'standard') {
    state.settings.activeWorkoutProgrammeId = '';
    state.settings.pendingCycle = state.settings.activeCycle || 'A';
    state.settings.pendingDay = getSuggestedDay();
    state.settings.focusMode = false;
    state.settings.focusExerciseIndex = 0;
    saveState();
    render();
    toast('Standard applied.');
    return;
  }
  const programme = getWorkoutProgrammeTemplate(id);
  if (!programme) { toast('Programme not found.'); return; }
  state.settings.activeWorkoutProgrammeId = id;
  state.settings.pendingCycle = state.settings.activeCycle || 'A';
  state.settings.pendingDay = getSuggestedDay();
  state.settings.focusMode = false;
  state.settings.focusExerciseIndex = 0;
  saveState();
  render();
  toast(`${programme.title} applied.`);
}


function renderCardioGoals() {
  const latest = [...(state.cardioGoals || [])].reverse();
  const defaults = cardioGoalFormDefaults();
  const active = getActiveCardioGoal();
  return `<section class="page" aria-labelledby="cardioGoalsTitle">
    <div class="hero-card goal-hero">
      <p class="eyebrow">Running Plan</p>
      <h2 id="cardioGoalsTitle" class="hero-title">Create a clear running plan.</h2>
    </div>

    ${renderActiveCardioPlanControls(active)}

    <form id="cardioGoalForm" class="panel goal-form">
      <div class="panel-header"><div><p class="eyebrow">Create cardio plan</p><h3>Create plan</h3></div></div>

      <section class="goal-step-card" aria-labelledby="presetTitle">
        <div class="step-number" aria-hidden="true">1</div>
        <div class="step-content">
          <h4 id="presetTitle">Choose a distance milestone</h4>
          
          <div class="preset-card-row distance-preset-grid" aria-label="Major running distance presets">
            <button class="preset-card" type="button" data-action="preset-5k"><strong>5K</strong><span>3.1 miles · 8-week template.</span></button>
            <button class="preset-card" type="button" data-action="preset-10k"><strong>10K</strong><span>6.2 miles · 12-week template.</span></button>
            <button class="preset-card featured" type="button" data-action="preset-half"><strong>Half-marathon</strong><span>13.1 miles · 16-week template.</span></button>
            <button class="preset-card" type="button" data-action="preset-marathon"><strong>Marathon</strong><span>26.2 miles · 20-week template.</span></button>
            <button class="preset-card" type="button" data-action="preset-ultra"><strong>Ultra marathon</strong><span>50K / 31.1 miles · 24-week template.</span></button>
          </div>
        </div>
      </section>

      <section class="goal-step-card" aria-labelledby="targetTitle">
        <div class="step-number" aria-hidden="true">2</div>
        <div class="step-content">
          <h4 id="targetTitle">Your target</h4>
          <div class="goal-grid compact target-grid">
            <label>Plan name<input name="title" value="${esc(defaults.title)}" placeholder="e.g. 5K comfort build" autocomplete="off"></label>
            <label>Distance<input name="targetDistance" type="number" min="0.1" step="0.1" inputmode="decimal" placeholder="e.g. 3.1" value="${esc(defaults.targetDistance)}"></label>
            <label>Distance unit<select name="distanceUnit"><option value="mi" ${selectedAttr(defaults.distanceUnit, 'mi')}>miles</option><option value="km" ${selectedAttr(defaults.distanceUnit, 'km')}>km</option></select></label>
            <label>Target speed<input name="targetSpeed" type="number" min="1" step="0.1" inputmode="decimal" placeholder="e.g. 6.5" value="${esc(defaults.targetSpeed)}"></label>
            <label>Speed unit<select name="speedUnit"><option value="mph" ${selectedAttr(defaults.speedUnit, 'mph')}>mph</option><option value="kph" ${selectedAttr(defaults.speedUnit, 'kph')}>kph</option></select></label>
          </div>
          <div id="goalPreview" class="goal-preview" aria-live="polite"></div>
        </div>
      </section>

      <section class="goal-step-card" aria-labelledby="baselineTitle">
        <div class="step-number" aria-hidden="true">3</div>
        <div class="step-content">
          <h4 id="baselineTitle">Where you are now</h4>
          
          <div class="goal-grid baseline-grid">
            <label>Comfortable easy speed<input name="currentEasySpeed" type="number" min="1" step="0.1" inputmode="decimal" placeholder="e.g. 5.5" value="${esc(defaults.currentEasySpeed)}"><span class="field-hint">Your relaxed treadmill speed.</span></label>
            <label>Comfortable easy duration<input name="currentEasyMinutes" type="number" min="10" step="5" inputmode="numeric" placeholder="e.g. 30" value="${esc(defaults.currentEasyMinutes)}"><span class="field-hint">Minutes you can run without forcing it.</span></label>
            <label>Recent hard-run distance<input name="currentBenchmarkDistance" type="number" min="0.1" step="0.1" inputmode="decimal" placeholder="e.g. 2" value="${esc(defaults.currentBenchmarkDistance)}"><span class="field-hint">A recent challenging run.</span></label>
            <label>Recent hard-run speed<input name="currentBenchmarkSpeed" type="number" min="1" step="0.1" inputmode="decimal" placeholder="e.g. 6.2" value="${esc(defaults.currentBenchmarkSpeed)}"><span class="field-hint">Average speed for that run.</span></label>
            <label>Benchmark RPE<input name="currentBenchmarkRpe" type="number" min="1" max="10" step="0.5" inputmode="decimal" placeholder="e.g. 7" value="${esc(defaults.currentBenchmarkRpe)}"><span class="field-hint">1 = very easy, 10 = maximum.</span></label>
          </div>
          <details class="rpe-help"><summary>RPE guide</summary><div class="rpe-scale"><span><strong>5–6</strong> controlled</span><span><strong>7</strong> hard but sustainable</span><span><strong>8</strong> very hard</span><span><strong>9</strong> near max</span><span><strong>10</strong> max</span></div></details>
        </div>
      </section>

      <details class="advanced-goal-options">
        <summary><span>Advanced options</span><small>Timeline and staged second goal</small></summary>
        <fieldset class="goal-fieldset">
          <legend>Timeline</legend>
          <label>Plan length<select name="timeline"><option value="auto" ${selectedAttr(defaults.timeline, 'auto')}>Auto-select gentle timeline</option><option value="8" ${selectedAttr(defaults.timeline, '8')}>8 weeks</option><option value="12" ${selectedAttr(defaults.timeline, '12')}>12 weeks</option><option value="16" ${selectedAttr(defaults.timeline, '16')}>16 weeks</option><option value="20" ${selectedAttr(defaults.timeline, '20')}>20 weeks</option><option value="24" ${selectedAttr(defaults.timeline, '24')}>24 weeks</option><option value="28" ${selectedAttr(defaults.timeline, '28')}>28 weeks</option><option value="32" ${selectedAttr(defaults.timeline, '32')}>32 weeks</option></select><span class="field-hint">Auto is safest unless you have a specific event date.</span></label>
        </fieldset>
        <fieldset class="goal-fieldset staged-fieldset">
          <legend>Optional staged second goal</legend>
          <label class="checkbox-card"><input name="useSecondGoal" type="checkbox" ${checkedAttr(defaults.useSecondGoal)}> <span><strong>Use a second goal as Phase 2</strong><small>Use this when one target is a stepping stone to a bigger target. Tiger will not stack two hard plans in the same week.</small></span></label>
          <div class="goal-grid secondary-goal-fields" aria-label="Staged second goal fields">
            <label>Second target distance<input name="secondaryTargetDistance" type="number" min="0.1" step="0.1" inputmode="decimal" placeholder="optional" value="${esc(defaults.secondaryTargetDistance)}"></label>
            <label>Second target speed<input name="secondaryTargetSpeed" type="number" min="1" step="0.1" inputmode="decimal" placeholder="optional" value="${esc(defaults.secondaryTargetSpeed)}"></label>
          </div>
          <p class="muted small">Best use: one goal becomes a stepping stone to a larger goal.</p>
        </fieldset>
      </details>

      <div class="goal-submit-bar"><div><strong>Ready?</strong></div><button class="btn" type="submit">Save</button></div>
    </form>

    <section class="panel">
      <div class="panel-header"><div><h3>Plan library</h3></div><span class="chip">${latest.length} saved</span></div>
      ${active ? `<div class="active-plan-strip"><strong>Applied:</strong> ${esc(active.title)} <span>Week ${esc(getActiveCardioPlanWeek(active))}/${esc(active.weeks)}</span></div>` : ''}
      <div class="progress-table-wrap plan-summary-wrap">${renderCardioPlanSummary(latest)}</div>
      <div class="exercise-list">
        ${latest.length ? latest.map(plan => renderCardioGoalPlan(plan)).join('') : '<p class="muted">No running plans yet. Save one above.</p>'}
      </div>
    </section>
  </section>`;
}

function renderCardioPlanSummary(plans) {
  if (!plans.length) return '';
  return `<table class="progress-table compact-table"><thead><tr><th>Plan</th><th>Type</th><th>Goal</th><th>Weeks</th><th>Applied</th></tr></thead><tbody>${plans.map(plan => {
    const goal = plan.planType === 'staged' && plan.secondaryTargetMiles ? `${milesToDisplay(plan.targetMiles, plan.distanceUnit)} → ${milesToDisplay(plan.secondaryTargetMiles, plan.distanceUnit)}` : milesToDisplay(plan.targetMiles, plan.distanceUnit);
    return `<tr><td>${esc(plan.title)}</td><td>${esc(plan.planType || 'single')}</td><td>${esc(goal)} at ${esc(speedToDisplay(plan.planType === 'staged' ? plan.secondaryTargetMph : plan.targetMph, plan.speedUnit))}</td><td>${esc(plan.weeks)}</td><td>${state.settings.activeCardioGoalId === plan.id ? 'Yes' : 'No'}</td></tr>`;
  }).join('')}</tbody></table>`;
}
function renderCardioGoalPlan(plan) {
  const finalSpeed = plan.planType === 'staged' && plan.secondaryTargetMph ? plan.secondaryTargetMph : plan.targetMph;
  const finalDistance = plan.planType === 'staged' && plan.secondaryTargetMiles ? plan.secondaryTargetMiles : plan.targetMiles;
  const targetLabel = plan.planType === 'staged'
    ? `${milesToDisplay(plan.targetMiles, plan.distanceUnit)} at ${speedToDisplay(plan.targetMph, plan.speedUnit)} → ${milesToDisplay(plan.secondaryTargetMiles, plan.distanceUnit)} at ${speedToDisplay(plan.secondaryTargetMph, plan.speedUnit)}`
    : `${milesToDisplay(plan.targetMiles, plan.distanceUnit)} at ${speedToDisplay(plan.targetMph, plan.speedUnit)}`;
  const timeLabel = targetTimeLabel(finalDistance, finalSpeed);
  const isActive = state.settings.activeCardioGoalId === plan.id;
  return `<article class="exercise-card cardio-goal-card ${isActive ? 'is-active-plan' : ''}" data-goal-id="${esc(plan.id)}">
    <div class="exercise-top"><div><div class="exercise-title"><h3>${esc(plan.title)}</h3><span class="chip good">${esc(plan.weeks)} weeks</span><span class="chip">${esc(plan.planType || 'single')}</span>${isActive ? '<span class="chip alt">Applied</span>' : ''}</div><p class="exercise-notes"><strong>${esc(targetLabel)}</strong> · final target time ${esc(timeLabel)} · ${esc(paceLabel(finalSpeed))}</p>${plan.guidance ? `<p class="muted small">${esc(plan.guidance)}</p>` : ''}</div><div class="card-actions"><button class="btn btn-small" data-action="set-active-cardio-goal" data-goal-id="${esc(plan.id)}">${isActive ? 'Applied' : 'Apply'}</button><button class="btn btn-small btn-ghost" data-action="export-cardio-plan" data-goal-id="${esc(plan.id)}">CSV</button><button class="btn btn-small btn-danger" data-action="delete-cardio-goal" data-goal-id="${esc(plan.id)}">Delete</button></div></div>
    <div class="progress-table-wrap"><table class="progress-table goal-table"><thead><tr><th>Week</th><th>Phase</th><th>Monday</th><th>Wednesday</th><th>Notes</th></tr></thead><tbody>${plan.planRows.map(row => `<tr><td>${esc(row.week)}</td><td>${esc(row.phase || '—')}</td><td>${esc(row.monday)}</td><td>${esc(row.wednesday)}</td><td>${esc(row.notes)}</td></tr>`).join('')}</tbody></table></div>
  </article>`;
}


function getGoalFormNumbers(form) {
  const distanceUnit = formValue(form, 'distanceUnit') || 'mi';
  const speedUnit = formValue(form, 'speedUnit') || 'mph';
  const targetDistance = Number(formValue(form, 'targetDistance'));
  const targetSpeed = Number(formValue(form, 'targetSpeed'));
  const benchmarkRpe = Number(formValue(form, 'currentBenchmarkRpe'));
  return { distanceUnit, speedUnit, targetDistance, targetSpeed, benchmarkRpe, targetMiles: milesFrom(targetDistance, distanceUnit), targetMph: mphFrom(targetSpeed, speedUnit) };
}
function updateCardioGoalPreview() {
  const form = document.getElementById('cardioGoalForm');
  const preview = document.getElementById('goalPreview');
  if (!form || !preview) return;
  const data = getGoalFormNumbers(form);
  const useSecond = formChecked(form, 'useSecondGoal');
  const secondFields = form.querySelector('.secondary-goal-fields');
  if (secondFields) secondFields.classList.toggle('is-dimmed', !useSecond);
  if (!data.targetMiles || !data.targetMph) {
    preview.innerHTML = '<strong>Target preview:</strong> enter a distance and speed to see the goal time.';
    return;
  }
  const time = targetTimeLabel(data.targetMiles, data.targetMph);
  const pace = paceLabel(data.targetMph);
  const rpeText = data.benchmarkRpe ? ` · benchmark RPE ${data.benchmarkRpe}/10` : '';
  const message = useSecond ? 'This will save Phase 1 of a staged plan.' : 'This will save one Monday/Wednesday running plan.';
  preview.innerHTML = `<strong>Target preview:</strong> ${esc(milesToDisplay(data.targetMiles, data.distanceUnit))} at ${esc(speedToDisplay(data.targetMph, data.speedUnit))} = ${esc(time)} · ${esc(pace)}${esc(rpeText)}<br><span>${esc(message)}</span>`;
}

function formField(form, name) { return form?.elements?.namedItem(name); }
function formValue(form, name) { return formField(form, name)?.value || ''; }
function formChecked(form, name) { return !!formField(form, name)?.checked; }


function cardioGoalDraftFromForm(form) {
  return {
    title: formValue(form, 'title').trim() || 'Running plan',
    targetDistance: formValue(form, 'targetDistance'),
    distanceUnit: formValue(form, 'distanceUnit') || 'mi',
    targetSpeed: formValue(form, 'targetSpeed'),
    speedUnit: formValue(form, 'speedUnit') || 'mph',
    currentEasySpeed: formValue(form, 'currentEasySpeed'),
    currentEasyMinutes: formValue(form, 'currentEasyMinutes'),
    currentBenchmarkDistance: formValue(form, 'currentBenchmarkDistance'),
    currentBenchmarkSpeed: formValue(form, 'currentBenchmarkSpeed'),
    currentBenchmarkRpe: formValue(form, 'currentBenchmarkRpe'),
    useSecondGoal: formChecked(form, 'useSecondGoal'),
    secondaryTargetDistance: formValue(form, 'secondaryTargetDistance'),
    secondaryTargetSpeed: formValue(form, 'secondaryTargetSpeed'),
    timeline: formValue(form, 'timeline') || 'auto'
  };
}
function persistCardioGoalDraft(form) {
  if (!form) return;
  state.settings.cardioGoalFormDraft = cardioGoalDraftFromForm(form);
}
function handleCardioGoalSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  persistCardioGoalDraft(form);
  const distanceUnit = formValue(form, 'distanceUnit') || 'mi';
  const speedUnit = formValue(form, 'speedUnit') || 'mph';
  const goal = {
    title: formValue(form, 'title').trim() || 'Running plan',
    targetDistance: Number(formValue(form, 'targetDistance')),
    distanceUnit,
    targetSpeed: Number(formValue(form, 'targetSpeed')),
    speedUnit,
    currentEasySpeed: Number(formValue(form, 'currentEasySpeed')),
    currentEasyMinutes: Number(formValue(form, 'currentEasyMinutes')),
    currentBenchmarkDistance: Number(formValue(form, 'currentBenchmarkDistance')),
    currentBenchmarkSpeed: Number(formValue(form, 'currentBenchmarkSpeed')),
    currentBenchmarkRpe: Number(formValue(form, 'currentBenchmarkRpe')),
    useSecondGoal: formChecked(form, 'useSecondGoal'),
    secondaryTargetDistance: Number(formValue(form, 'secondaryTargetDistance') || 0),
    secondaryTargetSpeed: Number(formValue(form, 'secondaryTargetSpeed') || 0),
    timeline: formValue(form, 'timeline') || 'auto',
    targetMiles: milesFrom(formValue(form, 'targetDistance'), distanceUnit),
    targetMph: mphFrom(formValue(form, 'targetSpeed'), speedUnit),
    currentEasyMph: mphFrom(formValue(form, 'currentEasySpeed'), speedUnit),
    currentBenchmarkMiles: milesFrom(formValue(form, 'currentBenchmarkDistance'), distanceUnit),
    currentBenchmarkMph: mphFrom(formValue(form, 'currentBenchmarkSpeed'), speedUnit),
    secondaryTargetMiles: milesFrom(formValue(form, 'secondaryTargetDistance') || 0, distanceUnit),
    secondaryTargetMph: mphFrom(formValue(form, 'secondaryTargetSpeed') || 0, speedUnit)
  };
  if (!goal.targetMiles || !goal.targetMph) {
    toast('Please enter a target distance and target speed.');
    return;
  }
  if (!goal.currentEasyMph) {
    goal.currentEasyMph = roundTo(clamp(goal.targetMph * 0.72, 3, Math.max(3, goal.targetMph - 0.5)), 0.1);
    goal.currentEasySpeed = Number(speedToDisplay(goal.currentEasyMph, speedUnit).split(' ')[0]);
  }
  if (!goal.currentEasyMinutes) goal.currentEasyMinutes = 30;
  if (!goal.currentBenchmarkMiles) {
    goal.currentBenchmarkMiles = roundTo(clamp(goal.targetMiles * 0.6, 0.5, goal.targetMiles), 0.1);
    goal.currentBenchmarkDistance = Number(milesToDisplay(goal.currentBenchmarkMiles, distanceUnit).split(' ')[0]);
  }
  if (!goal.currentBenchmarkMph) {
    goal.currentBenchmarkMph = roundTo(clamp(goal.targetMph * 0.86, goal.currentEasyMph, goal.targetMph), 0.1);
    goal.currentBenchmarkSpeed = Number(speedToDisplay(goal.currentBenchmarkMph, speedUnit).split(' ')[0]);
  }
  if (!goal.currentBenchmarkRpe) goal.currentBenchmarkRpe = 7;
  if (goal.useSecondGoal && (!goal.secondaryTargetMiles || !goal.secondaryTargetMph)) {
    toast('Enter valid second-goal distance and speed, or untick staged goal.');
    return;
  }
  const generated = buildCardioGoalPlan(goal);
  state.cardioGoals = state.cardioGoals || [];
  state.cardioGoals.push(generated);
  state.settings.cardioGoalFormDraft = defaultCardioGoal();
  saveState();
  render();
  toast(`${generated.weeks}-week running plan saved. Tap Apply in the library to use it.`);
}
function setGoalFormValues(values = {}) {
  const form = document.getElementById('cardioGoalForm');
  if (!form) return;
  Object.entries(values).forEach(([key, value]) => {
    const field = formField(form, key);
    if (!field) return;
    if (field.type === 'checkbox') field.checked = !!value;
    else field.value = value;
  });
  persistCardioGoalDraft(form);
  updateCardioGoalPreview();
}
const RUNNING_DISTANCE_PRESETS = {
  '5k': { title: '5K milestone plan', targetDistance: '3.1', distanceUnit: 'mi', timeline: '8' },
  '10k': { title: '10K milestone plan', targetDistance: '6.2', distanceUnit: 'mi', timeline: '12' },
  'half': { title: 'Half-marathon milestone plan', targetDistance: '13.1', distanceUnit: 'mi', timeline: '16' },
  'marathon': { title: 'Marathon milestone plan', targetDistance: '26.2', distanceUnit: 'mi', timeline: '20' },
  'ultra': { title: '50K ultra-marathon milestone plan', targetDistance: '31.1', distanceUnit: 'mi', timeline: '24' }
};
function applyDistancePreset(key) {
  const preset = RUNNING_DISTANCE_PRESETS[key];
  if (!preset) return;
  setGoalFormValues({
    title: preset.title,
    targetDistance: preset.targetDistance,
    distanceUnit: preset.distanceUnit,
    targetSpeed: '',
    speedUnit: 'mph',
    currentEasySpeed: '',
    currentEasyMinutes: '',
    currentBenchmarkDistance: '',
    currentBenchmarkSpeed: '',
    currentBenchmarkRpe: '',
    timeline: preset.timeline,
    useSecondGoal: false,
    secondaryTargetDistance: '',
    secondaryTargetSpeed: ''
  });
  toast(`${preset.title} loaded. Add your target speed and baseline, then Save.`);
}
function setActiveCardioGoal(id) {
  const plan = (state.cardioGoals || []).find(goal => goal.id === id);
  if (!plan) return;
  state.settings.activeCardioGoalId = id;
  state.settings.activeCardioPlanWeek = 1;
  saveState();
  render();
  toast('Applied running plan selected.');
}

function setActiveCardioPlanWeek(week) {
  const active = getActiveCardioGoal();
  if (!active) return;
  state.settings.activeCardioPlanWeek = normaliseCardioPlanWeek(active, week);
  saveState();
  render();
  toast(`Running plan week ${state.settings.activeCardioPlanWeek} applied to Monday/Wednesday.`);
}
function exportCardioPlan(id) {
  const plan = (state.cardioGoals || []).find(goal => goal.id === id);
  if (!plan) return;
  const rows = [['plan','type','week','phase','monday','wednesday','notes']];
  plan.planRows.forEach(row => rows.push([plan.title, plan.planType || 'single', row.week, row.phase || '', row.monday, row.wednesday, row.notes]));
  const csv = rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv' }), `tiger-running-plan-${todayIso()}.csv`);
  toast('Running plan CSV exported.');
}
function deleteCardioGoal(id) {
  if (!confirm('Delete this running plan?')) return;
  state.cardioGoals = (state.cardioGoals || []).filter(goal => goal.id !== id);
  if (state.settings.activeCardioGoalId === id) { state.settings.activeCardioGoalId = ''; state.settings.activeCardioPlanWeek = 1; }
  saveState();
  render();
  toast('Running plan deleted.');
}

function renderHistoryItem(session) {
  const completedSets = session.entries?.reduce((sum, entry) => sum + (entry.sets?.filter(set => set.done || set.reps || set.weight || set.duration).length || 0), 0) || 0;
  return `<article class="list-item history-item">
    <div><strong>${esc(niceDate(session.date))} · ${esc(cycleLabel(session.cycle))} ${esc(DAY_LABELS[session.day])}</strong><p class="muted small">${esc(session.title)} · ${completedSets} logged item${completedSets === 1 ? '' : 's'} ${session.readiness ? `· Readiness ${esc(session.readiness)}/5` : ''} ${session.notes ? `· ${esc(session.notes)}` : ''}</p></div>
    <button class="btn btn-small btn-danger" data-action="delete-session" data-session-id="${esc(session.id)}">Delete</button>
  </article>`;
}


function renderMore() {
  const moreItems = [
    { route: 'progress', title: 'Progress', text: 'Training history and trends.' },
    { route: 'insights', title: 'Insights', text: 'Strength, cardio and recovery signals.' },
    { route: 'cardio-goals', title: 'Running Plan', text: 'Cardio targets and saved running plans.' },
    { route: 'settings', title: 'Settings', text: 'Themes, backup, restore and app preferences.' }
  ];
  return `<section class="page more-page" aria-labelledby="moreTitle">
    <div class="toolbar">
      <div>
        <p class="eyebrow">More</p>
        <h2 id="moreTitle">More</h2>
      </div>
    </div>
    <section class="panel">
      <div class="more-grid">
        ${moreItems.map(item => `<button class="more-card" type="button" data-route-jump="${esc(item.route)}">
          <strong>${esc(item.title)}</strong>
          <span>${esc(item.text)}</span>
        </button>`).join('')}
      </div>
    </section>
  </section>`;
}

function renderSettings() {
  return `<section class="page settings-page" aria-labelledby="settingsTitle">
    <div class="toolbar">
      <div><p class="eyebrow">Settings</p><h2 id="settingsTitle">Tiger data, themes and backup</h2><p class="muted">This app is local-first. Your workout history is saved in this browser unless you export/import a backup.</p></div>
    </div>
    <div class="settings-stack">
      <section class="setting-card panel theme-panel"><h3>Themes</h3><p class="muted small">Choose a visual style, then optionally customise colours and font.</p><div class="theme-grid">${THEME_OPTIONS.map(t => `<button class="theme-choice ${state.settings.theme === t.id ? 'is-active' : ''}" data-action="set-theme" data-theme="${esc(t.id)}"><span class="theme-swatch" data-preview-theme="${esc(t.id)}"></span><span>${esc(t.label)}</span></button>`).join('')}</div><div class="custom-appearance-panel"><div class="panel-header compact"><div><h4>Custom colour and font</h4><p class="muted small">Pick your own accent colours and app font.</p></div></div><div class="appearance-grid"><label>Font<select id="fontSelect">${fontOptionsMarkup(state.settings.fontChoice || 'system')}</select></label><label>Primary<input id="customAccentInput" type="color" value="${esc(validHexColor(state.settings.customAccent, '#f97316'))}"></label><label>Secondary<input id="customAccent2Input" type="color" value="${esc(validHexColor(state.settings.customAccent2, '#7c3aed'))}"></label><label>Third<input id="customAccent3Input" type="color" value="${esc(validHexColor(state.settings.customAccent3, '#22c55e'))}"></label></div><label class="toggle-row custom-toggle"><input id="customColorsToggle" type="checkbox" ${state.settings.customColorsEnabled ? 'checked' : ''}> Use custom colours</label><div class="row-actions"><button type="button" class="btn btn-ghost" data-action="reset-custom-appearance">Reset custom colours</button></div></div></section>
      <section class="setting-card panel"><h3>Training week</h3><p class="muted small">You can also switch this from Home, Plan or Log without opening Settings.</p>${renderCycleSwitcher()}</section>
      <section class="setting-card panel"><h3>Rest weeks</h3><p class="muted small">Default: a deload after 4–6 hard weeks, or earlier if recovery markers are poor. Deload weights use about 85% of your normal target, then round to practical gym increments using your listed kg plate/load sizes: 1.25, 2.5, 5, 10, 15, 20 and 25 kg.</p><label>Planned deload interval<input id="deloadIntervalInput" type="number" min="4" max="8" step="1" value="${esc(state.settings.deloadIntervalWeeks || 5)}"></label><label class="checkbox-card slim-check"><input id="deloadActiveCheckbox" type="checkbox" ${state.settings.deloadActive ? 'checked' : ''}> <span><strong>Deload mode active</strong><small>Reduces strength set rows and reminds you to train easier.</small></span></label></section>
      <section class="setting-card panel settings-recovery-card"><h3>Recovery check</h3>${renderRecoveryDashboard().replace(/^<section class="panel">|<\/section>$/g, '')}</section>
      <section class="setting-card panel"><h3>Units</h3><label>Weight unit<select id="unitSelect"><option value="kg" ${state.settings.weightUnit === 'kg' ? 'selected' : ''}>kg</option><option value="lb" ${state.settings.weightUnit === 'lb' ? 'selected' : ''}>lb</option></select></label><label>Bodyweight<input id="bodyweightSettingInput" type="number" min="0" step="any" inputmode="decimal" value="${esc(state.settings.bodyweight || '')}" placeholder="${esc(state.settings.weightUnit)}"></label><p class="muted small">Pull-up total load: bodyweight + vest weight.</p></section>
    </div>
    <section class="panel"><h3>Gym-floor options</h3><label class="toggle-row"><input id="warmupToggle" type="checkbox" ${state.settings.showWarmups ? 'checked' : ''}> Show suggested warm-up sets for main lifts</label><p class="muted small">Warm-ups are guidance only and are excluded from progress stats.</p></section>
    <section class="panel"><div class="panel-header"><div><h3>Backup and restore</h3></div></div><div class="row-actions"><button class="btn" data-action="download-backup">Download backup JSON</button><label class="btn btn-ghost" for="backupImport">Import backup JSON</label><input id="backupImport" type="file" accept="application/json,.json" hidden></div></section>
    <section class="panel"><h3>Safety reset</h3><p class="muted">Use only if you have exported anything important. This removes local logs and notes on this device.</p><button class="btn btn-danger" data-action="reset-data">Reset local data</button><p class="muted small">Tiger v${esc(APP_VERSION)}</p></section>
  </section>`;
}

function bindPageEvents() {
  document.querySelectorAll('[data-route-jump]').forEach(btn => btn.addEventListener('click', () => routeTo(btn.dataset.routeJump)));
  document.querySelectorAll('[data-action="complete-onboarding"]').forEach(btn => btn.addEventListener('click', completeOnboarding));
  document.querySelectorAll('[data-action="dismiss-onboarding"]').forEach(btn => btn.addEventListener('click', dismissOnboarding));
  document.querySelectorAll('[data-action="log-workout"]').forEach(btn => btn.addEventListener('click', () => {
    state.settings.pendingCycle = btn.dataset.cycle || state.settings.activeCycle;
    state.settings.pendingDay = btn.dataset.day || getSuggestedDay();
    saveState();
    routeTo('log');
  }));
  document.querySelectorAll('[data-action="view-workout"]').forEach(btn => btn.addEventListener('click', () => {
    state.settings.activeCycle = btn.dataset.cycle || state.settings.activeCycle;
    saveState();
    routeTo('plan');
    setTimeout(() => {
      const details = [...document.querySelectorAll('.workout-detail')].find(d => d.dataset.workoutId === `${btn.dataset.cycle}-${btn.dataset.day}`);
      if (details) { details.open = true; details.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }, 50);
  }));
  const cycleSelect = document.getElementById('cycleSelect');
  if (cycleSelect) cycleSelect.addEventListener('change', () => { setActiveCycleManual(cycleSelect.value); saveState(); render(); });
  const logCycleSelect = document.getElementById('logCycleSelect');
  const logDaySelect = document.getElementById('logDaySelect');
  if (logCycleSelect) logCycleSelect.addEventListener('change', () => { const form = document.getElementById('sessionForm'); if (form) saveSessionDraftQuiet(form); state.settings.pendingCycle = logCycleSelect.value; state.settings.activeCycle = logCycleSelect.value; resetAutoCycleAnchor(logCycleSelect.value); saveState(); render(); });
  if (logDaySelect) logDaySelect.addEventListener('change', () => { state.settings.pendingDay = logDaySelect.value; saveState(); render(); });
  const form = document.getElementById('sessionForm');
  if (form) {
    form.addEventListener('submit', handleSessionSave);
    form.addEventListener('input', () => { clearSessionValidation(form); saveSessionDraftQuiet(form); updateSessionProgress(); });
    form.addEventListener('change', () => { clearSessionValidation(form); saveSessionDraftQuiet(form); updateSessionProgress(); });
    setTimeout(updateSessionProgress, 0);
  }
  document.querySelectorAll('[data-meta-weight]').forEach(input => input.addEventListener('input', e => {
    const id = e.target.dataset.metaWeight;
    getExerciseMeta(id).manualWeight = e.target.value;
    updatePullupTotals();
    saveState();
    toast(isBodyweightAddedExercise(id) ? 'Vest weight saved.' : 'Weight saved.');
  }));
  document.querySelectorAll('[data-bodyweight-setting]').forEach(input => input.addEventListener('input', e => {
    state.settings.bodyweight = e.target.value;
    updatePullupTotals();
    saveState();
    toast('Bodyweight saved.');
  }));
  document.querySelectorAll('[data-bodyweight-setting], [data-meta-weight]').forEach(input => input.addEventListener('input', updatePullupTotals));
  document.querySelectorAll('[data-meta-notes]').forEach(input => input.addEventListener('change', e => {
    const id = e.target.dataset.metaNotes;
    getExerciseMeta(id).notes = e.target.value;
    saveState();
    toast('Exercise note saved.');
  }));
  document.querySelectorAll('[data-action="download-backup"]').forEach(btn => btn.addEventListener('click', downloadBackup));
  document.querySelectorAll('[data-action="export-csv"]').forEach(btn => btn.addEventListener('click', exportCsv));
  document.querySelectorAll('[data-action="delete-session"]').forEach(btn => btn.addEventListener('click', () => deleteSession(btn.dataset.sessionId)));
  document.querySelectorAll('[data-action="toggle-cycle"]').forEach(btn => btn.addEventListener('click', () => { setActiveCycleManual(otherCycle(state.settings.activeCycle)); saveState(); render(); toast(`${cycleLabel(state.settings.activeCycle)} active.`); }));
  document.querySelectorAll('[data-action="set-cycle"]').forEach(btn => {
    if (btn.dataset.boundCycle) return;
    btn.dataset.boundCycle = '1';
    btn.addEventListener('click', () => { setActiveCycleManual(btn.dataset.cycle); saveState(); render(); toast(`${cycleLabel(state.settings.activeCycle)} active.`); });
  });
  document.querySelectorAll('[data-action="set-theme"]').forEach(btn => btn.addEventListener('click', () => { state.settings.theme = btn.dataset.theme; saveState(); render(); toast('Theme saved.'); }));
  const fontSelect = document.getElementById('fontSelect');
  if (fontSelect) fontSelect.addEventListener('change', () => { state.settings.fontChoice = fontSelect.value || 'system'; saveState(); applyAppearance(); toast('Font saved.'); });
  const customColorsToggle = document.getElementById('customColorsToggle');
  if (customColorsToggle) customColorsToggle.addEventListener('change', () => { state.settings.customColorsEnabled = customColorsToggle.checked; saveState(); applyAppearance(); render(); toast(state.settings.customColorsEnabled ? 'Custom colours on.' : 'Theme colours restored.'); });
  [['customAccentInput','customAccent'], ['customAccent2Input','customAccent2'], ['customAccent3Input','customAccent3']].forEach(([inputId, settingKey]) => {
    const input = document.getElementById(inputId);
    if (input) input.addEventListener('input', () => { state.settings[settingKey] = input.value; state.settings.customColorsEnabled = true; saveState(); applyAppearance(); const toggle = document.getElementById('customColorsToggle'); if (toggle) toggle.checked = true; });
  });
  document.querySelectorAll('[data-action="reset-custom-appearance"]').forEach(btn => btn.addEventListener('click', () => { state.settings.customColorsEnabled = false; state.settings.customAccent = '#f97316'; state.settings.customAccent2 = '#7c3aed'; state.settings.customAccent3 = '#22c55e'; saveState(); render(); toast('Custom colours reset.'); }));
  document.querySelectorAll('[data-action="reset-data"]').forEach(btn => btn.addEventListener('click', resetData));
  document.querySelectorAll('[data-action="prefill-last"]').forEach(btn => btn.addEventListener('click', prefillLastValues));
  document.querySelectorAll('[data-action="prefill-exercise"]').forEach(btn => btn.addEventListener('click', () => prefillExercise(btn.dataset.exerciseId)));
  document.querySelectorAll('[data-action="mark-all-done"]').forEach(btn => btn.addEventListener('click', markAllDone));
  document.querySelectorAll('[data-action="mark-exercise-done"]').forEach(btn => btn.addEventListener('click', () => markExerciseDone(btn.dataset.exerciseId)));
  document.querySelectorAll('[data-action="accept-skill-upgrade"]').forEach(btn => btn.addEventListener('click', () => acceptSkillUpgrade(btn.dataset.exerciseId)));
  document.querySelectorAll('[data-action="defer-skill-upgrade"]').forEach(btn => btn.addEventListener('click', () => deferSkillUpgrade(btn.dataset.exerciseId)));
  document.querySelectorAll('[data-action="revert-skill-upgrade"]').forEach(btn => btn.addEventListener('click', () => revertSkillUpgrade(btn.dataset.exerciseId)));
  document.querySelectorAll('[data-action="toggle-focus"]').forEach(btn => btn.addEventListener('click', toggleFocusMode));
  document.querySelectorAll('[data-action="focus-next"]').forEach(btn => btn.addEventListener('click', () => moveFocusExercise(1)));
  document.querySelectorAll('[data-action="focus-prev"]').forEach(btn => btn.addEventListener('click', () => moveFocusExercise(-1)));
  document.querySelectorAll('select[data-action="swap-exercise"]').forEach(sel => sel.addEventListener('change', handleExerciseSwap));
  document.querySelectorAll('[data-action="start-rest-timer"]').forEach(btn => btn.addEventListener('click', () => startRestTimer(btn.dataset.seconds, btn.dataset.restExercise || '', btn.dataset.restTarget || '')));
  document.querySelectorAll('[data-action="stop-rest-timer"]').forEach(btn => btn.addEventListener('click', () => stopRestTimer(btn.dataset.restTarget || '')));
  document.querySelectorAll('[data-action="activate-deload"]').forEach(btn => btn.addEventListener('click', activateDeload));
  document.querySelectorAll('[data-action="finish-deload"]').forEach(btn => btn.addEventListener('click', finishDeload));
  document.querySelectorAll('[data-action="log-deload"]').forEach(btn => btn.addEventListener('click', logDeloadMarker));
  const cardioGoalForm = document.getElementById('cardioGoalForm');
  if (cardioGoalForm) {
    cardioGoalForm.addEventListener('submit', handleCardioGoalSubmit);
    cardioGoalForm.querySelectorAll('input, select').forEach(field => field.addEventListener('input', () => { persistCardioGoalDraft(cardioGoalForm); updateCardioGoalPreview(); }));
    cardioGoalForm.querySelectorAll('input, select').forEach(field => field.addEventListener('change', () => { persistCardioGoalDraft(cardioGoalForm); updateCardioGoalPreview(); saveState(); }));
    updateCardioGoalPreview();
  }
  document.querySelectorAll('[data-action="preset-5k"]').forEach(btn => btn.addEventListener('click', () => applyDistancePreset('5k')));
  document.querySelectorAll('[data-action="preset-10k"]').forEach(btn => btn.addEventListener('click', () => applyDistancePreset('10k')));
  document.querySelectorAll('[data-action="preset-half"]').forEach(btn => btn.addEventListener('click', () => applyDistancePreset('half')));
  document.querySelectorAll('[data-action="preset-marathon"]').forEach(btn => btn.addEventListener('click', () => applyDistancePreset('marathon')));
  document.querySelectorAll('[data-action="preset-ultra"]').forEach(btn => btn.addEventListener('click', () => applyDistancePreset('ultra')));
  document.querySelectorAll('[data-action="set-active-cardio-goal"]').forEach(btn => btn.addEventListener('click', () => setActiveCardioGoal(btn.dataset.goalId)));
  document.querySelectorAll('[data-action="export-cardio-plan"]').forEach(btn => btn.addEventListener('click', () => exportCardioPlan(btn.dataset.goalId)));
  document.querySelectorAll('[data-action="delete-cardio-goal"]').forEach(btn => btn.addEventListener('click', () => deleteCardioGoal(btn.dataset.goalId)));
  document.querySelectorAll('[data-action="apply-workout-programme"]').forEach(btn => btn.addEventListener('click', () => applyWorkoutProgramme(btn.dataset.programmeId)));
  document.querySelectorAll('[data-action="cardio-plan-prev-week"]').forEach(btn => btn.addEventListener('click', () => setActiveCardioPlanWeek((state.settings.activeCardioPlanWeek || 1) - 1)));
  document.querySelectorAll('[data-action="cardio-plan-next-week"]').forEach(btn => btn.addEventListener('click', () => setActiveCardioPlanWeek((state.settings.activeCardioPlanWeek || 1) + 1)));
  const activeCardioPlanWeekInput = document.getElementById('activeCardioPlanWeekInput');
  if (activeCardioPlanWeekInput) activeCardioPlanWeekInput.addEventListener('change', () => setActiveCardioPlanWeek(activeCardioPlanWeekInput.value));
  const exerciseSearch = document.getElementById('exerciseSearch');
  if (exerciseSearch) exerciseSearch.addEventListener('input', () => filterExerciseRows(exerciseSearch.value));
  const unitSelect = document.getElementById('unitSelect');
  if (unitSelect) unitSelect.addEventListener('change', () => { state.settings.weightUnit = unitSelect.value; saveState(); render(); });
  const bodyweightSettingInput = document.getElementById('bodyweightSettingInput');
  if (bodyweightSettingInput) bodyweightSettingInput.addEventListener('change', () => { state.settings.bodyweight = bodyweightSettingInput.value; saveState(); render(); toast('Bodyweight saved.'); });
  const warmupToggle = document.getElementById('warmupToggle');
  if (warmupToggle) warmupToggle.addEventListener('change', () => { state.settings.showWarmups = warmupToggle.checked; saveState(); render(); toast('Warm-up display saved.'); });
  const deloadIntervalInput = document.getElementById('deloadIntervalInput');
  if (deloadIntervalInput) deloadIntervalInput.addEventListener('change', () => { state.settings.deloadIntervalWeeks = Number(deloadIntervalInput.value) || 5; saveState(); render(); toast('Rest-week interval saved.'); });
  const deloadActiveCheckbox = document.getElementById('deloadActiveCheckbox');
  if (deloadActiveCheckbox) deloadActiveCheckbox.addEventListener('change', () => {
    if (deloadActiveCheckbox.checked) activateDeload();
    else finishDeload();
  });
  const insightRange = document.getElementById('insightRangeSelect');
  if (insightRange) insightRange.addEventListener('change', () => { state.settings.insightRangeWeeks = Number(insightRange.value) || 8; saveState(); render(); });
  const insightExercise = document.getElementById('insightExerciseSelect');
  if (insightExercise) insightExercise.addEventListener('change', () => { state.settings.insightExerciseId = insightExercise.value; saveState(); render(); });
  const importInput = document.getElementById('backupImport');
  if (importInput) importInput.addEventListener('change', importBackup);
}


function toggleFocusMode() {
  const form = document.getElementById('sessionForm');
  if (form) saveSessionDraftQuiet(form);
  state.settings.focusMode = !state.settings.focusMode;
  state.settings.focusExerciseIndex = state.settings.focusMode ? focusIndexFor(getWorkout(form?.dataset.cycle || state.settings.pendingCycle || state.settings.activeCycle, form?.dataset.day || state.settings.pendingDay || getSuggestedDay())) : 0;
  saveState();
  routeTo(state.settings.focusMode ? 'focus' : 'log');
}
function moveFocusExercise(delta) {
  const form = document.getElementById('sessionForm');
  if (form) saveSessionDraftQuiet(form);
  const cycle = form?.dataset.cycle || state.settings.pendingCycle || state.settings.activeCycle;
  const day = form?.dataset.day || state.settings.pendingDay || getSuggestedDay();
  const workout = getWorkout(cycle, day);
  const max = Math.max(0, (workout.exercises?.length || 1) - 1);
  state.settings.focusExerciseIndex = Math.min(max, Math.max(0, Number(state.settings.focusExerciseIndex || 0) + delta));
  saveState();
  render();
}
function handleExerciseSwap(event) {
  const sel = event.currentTarget;
  const key = swapKey(sel.dataset.cycle, sel.dataset.day, sel.dataset.originalId);
  if (!state.settings.exerciseSwaps) state.settings.exerciseSwaps = {};
  if (sel.value) state.settings.exerciseSwaps[key] = sel.value;
  else delete state.settings.exerciseSwaps[key];
  const form = document.getElementById('sessionForm');
  if (form) saveSessionDraftQuiet(form);
  saveState();
  render();
  toast(sel.value ? 'Exercise swapped for this workout slot.' : 'Original exercise restored.');
}
function completeOnboarding() {
  const body = document.getElementById('setupBodyweight')?.value || state.settings.bodyweight || '';
  const unit = document.getElementById('setupUnit')?.value || state.settings.weightUnit;
  const cycle = document.getElementById('setupCycle')?.value || state.settings.activeCycle;
  state.settings.bodyweight = body;
  state.settings.weightUnit = unit;
  state.settings.activeCycle = cycle;
  resetAutoCycleAnchor(cycle);
  state.settings.pendingCycle = cycle;
  state.settings.pendingDay = getSuggestedDay();
  state.settings.lastAutoDaySync = todayIso();
  state.settings.onboardingComplete = true;
  saveState();
  render();
  toast('Quick setup saved.');
}
function dismissOnboarding() {
  state.settings.onboardingComplete = true;
  saveState();
  render();
}


function sessionFieldLabel(input) {
  const label = input.closest('label');
  if (label) {
    const text = [...label.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent.trim()).filter(Boolean).join(' ');
    if (text) return text;
  }
  if (input.name === 'exerciseRpe' || input.name === 'rpe') return 'RPE';
  if (input.name === 'reps') return 'Reps';
  if (input.name === 'readiness') return 'Readiness';
  if (input.name === 'duration') return 'Duration';
  if (input.name === 'distance') return 'Distance';
  if (input.name === 'speed') return 'Speed';
  if (input.hasAttribute('data-bodyweight-setting')) return 'Bodyweight';
  if (input.hasAttribute('data-meta-weight')) return 'Weight';
  return 'Number';
}
function clearSessionValidation(form) {
  form.querySelectorAll('.field-invalid').forEach(input => input.classList.remove('field-invalid'));
  const box = form.querySelector('#sessionValidation');
  if (box) {
    box.hidden = true;
    box.textContent = '';
  }
}
function validateSessionForm(form) {
  clearSessionValidation(form);
  const errors = [];
  [...form.querySelectorAll('input[type="number"]')].forEach(input => {
    const raw = input.value.trim();
    if (!raw) return;
    const value = Number(raw);
    let message = '';
    if (!Number.isFinite(value)) message = `${sessionFieldLabel(input)} must be a number.`;
    else if ((input.name === 'readiness') && (value < 1 || value > 5)) message = 'Readiness must be between 1 and 5.';
    else if ((input.name === 'exerciseRpe' || input.name === 'rpe') && (value < 1 || value > 10)) message = 'RPE must be between 1 and 10.';
    else if (input.name === 'reps' && (!Number.isInteger(value) || value < 0)) message = 'Reps must be a whole number of 0 or more.';
    else if (value < 0) message = `${sessionFieldLabel(input)} cannot be negative.`;
    if (message) {
      input.classList.add('field-invalid');
      errors.push({ input, message });
    }
  });
  if (!errors.length) return true;
  const box = form.querySelector('#sessionValidation');
  const uniqueMessages = [...new Set(errors.map(error => error.message))];
  if (box) {
    box.textContent = uniqueMessages.join(' ');
    box.hidden = false;
  }
  errors[0].input.focus({ preventScroll: true });
  errors[0].input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  toast('Please check the highlighted value.');
  return false;
}

function handleSessionSave(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!validateSessionForm(form)) return;
  const cycle = form.dataset.cycle;
  const day = form.dataset.day;
  const workout = getWorkout(cycle, day);
  const entries = [...form.querySelectorAll('.exercise-card[data-exercise-id]')].map(card => {
    const type = card.dataset.exerciseType;
    const exerciseId = card.dataset.exerciseId;
    const exerciseName = card.dataset.exerciseName;
    const noteInput = card.querySelector('[name="exerciseNotes"]');
    if (type === 'cardio') {
      return { exerciseId, exerciseName, type, notes: noteInput?.value || '', sets: [{ duration: val(card, 'duration'), distance: val(card, 'distance'), speed: val(card, 'speed'), rpe: val(card, 'rpe'), done: true }] };
    }
    const rows = [...card.querySelectorAll('tbody tr.work-set-row')];
    const loadMode = card.dataset.loadMode || '';
    const meta = getExerciseMeta(exerciseId);
    const manualWeight = card.querySelector('input[data-meta-weight]')?.value || '';
    const exerciseRpe = card.querySelector('input[name="exerciseRpe"]')?.value || '';
    const progressionQuality = !!card.querySelector('input[name="progressionQuality"]')?.checked;
    meta.manualWeight = manualWeight;
    const sets = rows.map((row, index) => {
      if (loadMode === 'bodyweight-added') {
        const bodyweight = card.querySelector('[data-bodyweight-setting]')?.value || state.settings.bodyweight || '';
        const addedWeight = manualWeight || '';
        const systemWeight = sumLoad(bodyweight, addedWeight);
        return {
          set: index + 1,
          bodyweight,
          addedWeight,
          systemWeight,
          weight: systemWeight,
          loadMode: 'bodyweight-added',
          reps: row.querySelector('input[name="reps"]')?.value || '',
          duration: row.querySelector('input[name="duration"]')?.value || '',
          rpe: exerciseRpe,
          done: !!row.querySelector('input[name="done"]')?.checked,
          unit: state.settings.weightUnit
        };
      }
      return {
        set: index + 1,
        weight: manualWeight,
        reps: row.querySelector('input[name="reps"]')?.value || '',
        duration: row.querySelector('input[name="duration"]')?.value || '',
        rpe: exerciseRpe,
        done: !!row.querySelector('input[name="done"]')?.checked,
        unit: state.settings.weightUnit
      };
    });
    if (loadMode === 'bodyweight-added') {
      const bodyweightValue = card.querySelector('[data-bodyweight-setting]')?.value || state.settings.bodyweight || '';
      state.settings.bodyweight = bodyweightValue;
    }
    meta.notes = noteInput?.value || meta.notes || '';
    return { exerciseId, exerciseName, type, loadMode, progressionQuality, notes: noteInput?.value || '', sets };
  });
  const sessionDate = form.date.value || todayIso();
  const existingSessions = clone(state.sessions || []);
  const existingDrafts = clone(state.sessionDrafts || {});
  const existingSettings = clone(state.settings || {});
  const existingExerciseMeta = clone(state.exerciseMeta || {});
  const existingForDay = (state.sessions || []).filter(item => dateOnly(item.date) === dateOnly(sessionDate) && item.cycle === cycle && item.day === day);
  const existing = existingForDay[0] || null;
  const session = { id: existing?.id || uid('session'), version: APP_VERSION, cycle, day, type: workout.type, title: workout.title, date: sessionDate, readiness: form.readiness?.value || '', notes: form.sessionNotes.value || '', deload: !!state.settings.deloadActive, entries, createdAt: existing?.createdAt || nowIso(), updatedAt: nowIso(), replaces: existingForDay.length ? existingForDay.map(item => item.id) : [] };
  const draftKey = sessionDraftKey(cycle, day);
  state.sessions = (state.sessions || []).filter(item => !(dateOnly(item.date) === dateOnly(sessionDate) && item.cycle === cycle && item.day === day));
  state.sessions.push(session);
  updateLoadCoachFromSession(session, workout);
  if (state.sessionDrafts) delete state.sessionDrafts[draftKey];
  delete state.settings.pendingCycle;
  delete state.settings.pendingDay;
  if (!saveState()) {
    state.sessions = existingSessions;
    state.sessionDrafts = existingDrafts;
    state.settings = existingSettings;
    state.exerciseMeta = existingExerciseMeta;
    const box = form.querySelector('#sessionValidation');
    if (box) {
      box.textContent = 'Tiger could not save this workout to local storage. Download a backup and check available browser storage.';
      box.hidden = false;
    }
    return;
  }
  toast(existingForDay.length ? 'Workout updated. Progress refreshed.' : 'Workout saved. Progress updated.');
  routeTo('progress');
}
function val(card, name) { return card.querySelector(`input[name="${name}"]`)?.value || ''; }

function collectSessionDraft(form) {
  const cycle = form.dataset.cycle;
  const day = form.dataset.day;
  const entries = {};
  [...form.querySelectorAll('.exercise-card[data-exercise-id]')].forEach(card => {
    const exerciseId = card.dataset.exerciseId;
    const type = card.dataset.exerciseType;
    const noteInput = card.querySelector('[name="exerciseNotes"]');
    if (type === 'cardio') {
      entries[exerciseId] = { notes: noteInput?.value || '', sets: [{ duration: val(card, 'duration'), distance: val(card, 'distance'), speed: val(card, 'speed'), rpe: val(card, 'rpe') }] };
      return;
    }
    const rows = [...card.querySelectorAll('tbody tr.work-set-row')];
    const loadMode = card.dataset.loadMode || '';
    const manualWeight = card.querySelector('input[data-meta-weight]')?.value || '';
    const bodyweight = card.querySelector('[data-bodyweight-setting]')?.value || '';
    const exerciseRpe = card.querySelector('input[name="exerciseRpe"]')?.value || '';
    const progressionQuality = !!card.querySelector('input[name="progressionQuality"]')?.checked;
    entries[exerciseId] = {
      notes: noteInput?.value || '',
      sessionRpe: exerciseRpe,
      progressionQuality,
      sets: rows.map((row, index) => ({
        set: index + 1,
        weight: loadMode === 'bodyweight-added' ? sumLoad(bodyweight, manualWeight) : manualWeight,
        bodyweight: loadMode === 'bodyweight-added' ? bodyweight : '',
        addedWeight: loadMode === 'bodyweight-added' ? manualWeight : '',
        reps: row.querySelector('input[name="reps"]')?.value || '',
        duration: row.querySelector('input[name="duration"]')?.value || '',
        rpe: exerciseRpe,
        done: !!row.querySelector('input[name="done"]')?.checked
      }))
    };
  });
  return { cycle, day, date: form.date?.value || todayIso(), readiness: form.readiness?.value || '', sessionNotes: form.sessionNotes?.value || '', entries, updatedAt: nowIso() };
}
function saveSessionDraftQuiet(form) {
  if (!state.sessionDrafts) state.sessionDrafts = {};
  state.sessionDrafts[sessionDraftKey(form.dataset.cycle, form.dataset.day)] = collectSessionDraft(form);
  saveState();
}
function prefillExercise(exerciseId) {
  const card = document.querySelector(`.exercise-card[data-exercise-id="${CSS.escape(exerciseId)}"]`);
  const last = lastExerciseEntry(exerciseId);
  if (!card || !last) { toast('No previous values for this exercise yet.'); return; }
  if (card.dataset.exerciseType === 'cardio') {
    const set = last.entry.sets?.[0] || {};
    ['duration', 'distance', 'speed', 'rpe'].forEach(name => {
      const input = card.querySelector(`input[name="${name}"]`);
      if (input && set[name]) input.value = set[name];
    });
  } else {
    const firstSet = last.entry.sets?.[0] || {};
    const metaInput = card.querySelector('input[data-meta-weight]');
    const rpeInput = card.querySelector('input[name="exerciseRpe"]');
    if (card.dataset.loadMode === 'bodyweight-added') {
      const bwInput = card.querySelector('[data-bodyweight-setting]');
      if (bwInput && firstSet.bodyweight) bwInput.value = firstSet.bodyweight;
      if (metaInput && firstSet.addedWeight) metaInput.value = firstSet.addedWeight;
    } else if (metaInput && firstSet.weight) {
      metaInput.value = firstSet.weight;
    }
    if (rpeInput && firstSet.rpe) rpeInput.value = firstSet.rpe;
    const rows = [...card.querySelectorAll('tbody tr.work-set-row')];
    rows.forEach((row, index) => {
      const lastSet = last.entry.sets?.[index] || firstSet;
      if (!lastSet) return;
      const repsInput = row.querySelector('input[name="reps"]');
      const durationInput = row.querySelector('input[name="duration"]');
      if (repsInput && lastSet.reps) repsInput.value = lastSet.reps;
      if (durationInput && lastSet.duration) durationInput.value = lastSet.duration;
    });
  }
  updatePullupTotals();
  updateSessionProgress();
  const form = document.getElementById('sessionForm');
  if (form) saveSessionDraftQuiet(form);
  toast('Previous values filled for this exercise.');
}
function markExerciseDone(exerciseId) {
  document.querySelectorAll(`.exercise-card[data-exercise-id="${CSS.escape(exerciseId)}"] input[name="done"]`).forEach(input => { input.checked = true; });
  updateSessionProgress();
  const form = document.getElementById('sessionForm');
  if (form) saveSessionDraftQuiet(form);
  toast('Exercise marked done.');
}

function prefillLastValues() {
  document.querySelectorAll('.exercise-card[data-exercise-id]').forEach(card => {
    const id = card.dataset.exerciseId;
    const last = lastExerciseEntry(id);
    if (!last) return;
    if (card.dataset.exerciseType === 'cardio') {
      const set = last.entry.sets?.[0] || {};
      ['duration', 'distance', 'speed', 'rpe'].forEach(name => {
        const input = card.querySelector(`input[name="${name}"]`);
        if (input && set[name]) input.value = set[name];
      });
      const note = card.querySelector('[name="exerciseNotes"]');
      if (note && last.entry.notes) note.value = last.entry.notes;
      return;
    }
    const firstSet = last.entry.sets?.[0] || {};
    const metaInput = card.querySelector('input[data-meta-weight]');
    const rpeInput = card.querySelector('input[name="exerciseRpe"]');
    if (card.dataset.loadMode === 'bodyweight-added') {
      const bwInput = card.querySelector('[data-bodyweight-setting]');
      if (bwInput && firstSet.bodyweight) bwInput.value = firstSet.bodyweight;
      if (metaInput && firstSet.addedWeight) metaInput.value = firstSet.addedWeight;
    } else if (metaInput && firstSet.weight) {
      metaInput.value = firstSet.weight;
    }
    if (rpeInput && firstSet.rpe) rpeInput.value = firstSet.rpe;
    const rows = [...card.querySelectorAll('tbody tr.work-set-row')];
    rows.forEach((row, index) => {
      const lastSet = last.entry.sets?.[index] || firstSet;
      if (!lastSet) return;
      const repsInput = row.querySelector('input[name="reps"]');
      const durationInput = row.querySelector('input[name="duration"]');
      if (repsInput && lastSet.reps) repsInput.value = lastSet.reps;
      if (durationInput && lastSet.duration) durationInput.value = lastSet.duration;
    });
  });
  updatePullupTotals();
  updateSessionProgress();
  const form = document.getElementById('sessionForm');
  if (form) saveSessionDraftQuiet(form);
  toast('Last values filled where available.');
}
function updatePullupTotals() {
  document.querySelectorAll('.exercise-card[data-load-mode="bodyweight-added"]').forEach(card => {
    const total = sumLoad(card.querySelector('[data-bodyweight-setting]')?.value, card.querySelector('input[data-meta-weight]')?.value);
    card.querySelectorAll('.exercise-total-load-output, .total-load-output').forEach(output => { output.textContent = total || '—'; });
  });
}
function markAllDone() {
  document.querySelectorAll('input[name="done"]').forEach(input => { input.checked = true; });
  updateSessionProgress();
  const form = document.getElementById('sessionForm');
  if (form) saveSessionDraftQuiet(form);
  toast('Visible strength exercises marked done.');
}
function filterExerciseRows(query) {
  const q = String(query || '').trim().toLowerCase();
  document.querySelectorAll('.progress-table tbody tr').forEach(row => {
    row.hidden = q && !row.textContent.toLowerCase().includes(q);
  });
}
function activateDeload() {
  if (!state.settings.deloadActive) {
    state.settings.deloadOriginalWeights = captureDeloadOriginalWeights();
    applyDeloadWeightsFromSnapshot(state.settings.deloadOriginalWeights);
  }
  state.settings.deloadActive = true;
  state.settings.lastDeloadDate = state.settings.lastDeloadDate || todayIso();
  if (!state.deloads.some(d => d.startDate === state.settings.lastDeloadDate && !d.endDate)) {
    state.deloads.push({ id: uid('deload'), startDate: todayIso(), reason: 'Manual deload/rest week activated; target weights temporarily reduced and rounded to practical gym increments', createdAt: nowIso(), factor: getDeloadFactor(), originalWeights: state.settings.deloadOriginalWeights });
  }
  saveState();
  render();
  toast('Deload active. Target weights reduced, rounded and protected.');
}
function finishDeload() {
  const restored = restoreDeloadOriginalWeights();
  state.settings.deloadActive = false;
  state.settings.lastDeloadDate = todayIso();
  const open = [...state.deloads].reverse().find(d => !d.endDate);
  if (open) { open.endDate = todayIso(); open.restoredWeights = restored; }
  else state.deloads.push({ id: uid('deload'), startDate: todayIso(), endDate: todayIso(), reason: 'Deload/rest week completed', createdAt: nowIso(), restoredWeights: restored });
  saveState();
  render();
  toast(restored ? 'Deload finished. Normal target weights restored.' : 'Deload finished and logged.');
}
function logDeloadMarker() {
  state.settings.lastDeloadDate = todayIso();
  state.deloads.push({ id: uid('deload'), startDate: todayIso(), endDate: todayIso(), reason: 'Manual deload marker', createdAt: nowIso() });
  saveState();
  render();
  toast('Deload marker logged.');
}

function deleteSession(id) {
  if (!confirm('Delete this logged session?')) return;
  state.sessions = state.sessions.filter(s => s.id !== id);
  saveState();
  render();
  toast('Session deleted.');
}
function resetData() {
  if (!confirm('Reset all local Tiger data on this device? Export a backup first if needed.')) return;
  state = clone(DEFAULT_STATE);
  saveState();
  render();
  toast('Local data reset.');
}
function downloadBackup() {
  const payload = { app: APP_NAME, version: APP_VERSION, exportedAt: nowIso(), storageKey: STORAGE_KEY, data: state };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `tiger-backup-${todayIso()}.json`);
  toast('Backup downloaded.');
}
function importBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const incoming = parsed.data || parsed;
      if (!incoming || !Array.isArray(incoming.sessions) || !incoming.settings) throw new Error('Invalid backup');
      if (!confirm('Import this backup and replace current local data?')) return;
      state = migrateState(incoming);
      saveState();
      render();
      toast('Backup imported.');
    } catch (err) {
      toast('Import failed: backup file was not recognised.');
    }
  };
  reader.readAsText(file);
}
function exportCsv() {
  const rows = [['date','cycle','day','session_title','deload','readiness','exercise','type','set','weight_or_total_load','bodyweight','added_weight','unit','reps','duration_min','distance_miles','speed_mph','rpe','done','notes']];
  state.sessions.forEach(session => {
    session.entries?.forEach(entry => {
      entry.sets?.forEach(set => rows.push([
        session.date, session.cycle, session.day, session.title, session.deload ? 'yes' : '', session.readiness || '', entry.exerciseName, entry.type, set.set || 1,
        set.weight || '', set.bodyweight || '', set.addedWeight || '', set.unit || state.settings.weightUnit, set.reps || '', set.duration || '', set.distance || '', set.speed || '', set.rpe || '', set.done ? 'yes' : '', entry.notes || ''
      ]));
    });
  });
  const csv = rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv' }), `tiger-sessions-${todayIso()}.csv`);
  toast('CSV exported.');
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}



function wireGlobalEvents() {
  document.querySelectorAll('.nav-link').forEach(btn => btn.addEventListener('click', () => routeTo(btn.dataset.route)));
  document.querySelectorAll('.quick-cycle-btn').forEach(btn => btn.addEventListener('click', () => { state.settings.activeCycle = btn.dataset.cycle || state.settings.activeCycle; saveState(); render(); toast(`${cycleLabel(state.settings.activeCycle)} active.`); }));
  document.getElementById('quickBackupBtn')?.addEventListener('click', downloadBackup);
  document.getElementById('quickLogTodayBtn')?.addEventListener('click', () => {
    state.settings.pendingCycle = state.settings.activeCycle;
    state.settings.pendingDay = getSuggestedDay();
    saveState();
    routeTo('log');
  });
}

wireGlobalEvents();
render();


