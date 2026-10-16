/* New cross-system investigations. These IDs do not reuse any world/case rewards. */
window.InneruDetectiveCases = [
  {
    id:'touch',system:'Integumentary',title:'The fingertip code',method:'Tactile discrimination experiment',
    image:'assets/home-expedition/01-shield.webp',alt:'Detailed skin cutaway with sensory structures in the dermis.',
    story:'An illustrative set of touch trials records two-point reports more often on a fingertip than on a forearm. Is the difference in the data, or in how the comparison was made?',
    anatomy:'Cutaneous mechanoreceptors and their receptive fields contribute to touch discrimination. Different skin regions can have different spatial sensitivity.',
    mission:'Collect ten-trial results for both sites at 3 mm and 12 mm separation.',
    evidence:[['At 3 mm, two points were reported in 8/10 fingertip trials and 1/10 forearm trials.','Trial results'],['Exactly ten trials used the same contact method for each site and spacing.','Method log'],['The forearm must contain no sensory receptors at all.','An untested assertion'],['The bench has a mint-coloured border.','Room description']],pins:[0,1],
    claims:['The forearm has no touch sensation.','This dataset shows finer spatial discrimination at the fingertip.','Every person has exactly the same touch threshold.'],answer:1,
    limits:['These results count the exact number of skin receptors.','This virtual test diagnoses a nerve disorder.','The data do not provide an exact receptor count or a universal threshold.'],limit:2,
    solution:'The controlled trial pattern supports a difference in spatial discrimination in these illustrative data. Receptive-field organisation and receptor distribution help explain touch resolution; a response table does not directly count receptors.'
  },
  {
    id:'spine',system:'Skeletal',title:'The overnight height mystery',method:'Paired measurements across time',
    image:'assets/home-expedition/02-framework.webp',alt:'Skeleton and an enlarged spine within the thorax.',
    story:'An adult volunteer measures slightly shorter in the evening and taller again after a night of rest. A report claims that the vertebral bones permanently shrank in one day. Check the time-stamped evidence.',
    anatomy:'Intervertebral discs lie between vertebral bodies. Loading can compress them and alter fluid distribution; unloading during rest can allow recovery.',
    mission:'Compare morning with evening, then evening with the following morning. Read the measurement-method log.',
    evidence:[['The evening measurement is 1.0 cm lower than the first morning measurement.','Paired comparison'],['The volunteer changed the colour of their notebook.','Context note'],['Height is close to the starting value the following morning, using the same measurement method.','Repeat + method log'],['A permanent loss of vertebral bone was directly observed.','An unsupported assertion']],pins:[0,2],
    claims:['Reversible disc compression and fluid shifts are consistent with the pattern.','The vertebral bones grew and then shrank permanently within hours.','The data prove that every height change is a fracture.'],answer:0,
    limits:['These three measurements diagnose a spinal disease.','The pattern is compatible with a mechanism; it does not establish a medical diagnosis.','A single evening value proves permanent bone loss.'],limit:1,
    solution:'The return toward the starting height argues against permanent daily shrinkage of the vertebral bones. Reversible intervertebral-disc compression and fluid shifts offer a plausible explanation. These fictional measurements do not prove a diagnosis.'
  },
  {
    id:'wave',system:'Muscular',title:'The travelling squeeze',method:'Reversible time-lapse comparison',
    image:'assets/detective/smooth-muscle.webp',alt:'Hollow-organ wall showing circular and longitudinal smooth-muscle layers and a bolus.',
    story:'A marker travels through a horizontal model tube. There is no hand pushing it. Compare the direction of a travelling muscle wave with the direction of marker movement.',
    anatomy:'Circular and longitudinal smooth-muscle layers in hollow organs help coordinate peristalsis. A contraction behind material, with relaxation ahead, can propel it.',
    mission:'Inspect the final frame of both the forward-wave and reverse-wave model.',
    evidence:[['The tube is horizontal in both comparisons.','Controlled condition'],['The diagram has a brass frame.','Display description'],['The marker changes direction when the travelling wave is reversed.','Time-lapse observations'],['The marker must be a contracting bone.','An unsupported assertion']],pins:[0,2],
    claims:['Gravity alone explains the opposite movements in the horizontal tube.','The marker moves because the tube contains biceps muscle.','The travelling contraction pattern provides directional propulsion in this model.'],answer:2,
    limits:['The schematic isolates a principle; it does not predict an individual person’s gut transit time.','Four frames reveal the exact speed of digestion in every person.','The model proves all hollow-organ movement is voluntary.'],limit:0,
    solution:'Reversing the wave reverses marker movement in the same horizontal model, supporting directional propulsion by the travelling contraction. Real peristalsis involves coordinated activity of circular and longitudinal smooth muscle and neural control.'
  },
  {
    id:'air',system:'Respiratory',title:'The cloudy-air alibi',method:'Control a paired indicator experiment',
    image:'assets/home-expedition/04-oxygen.webp',alt:'Lungs, airways and diaphragm in an anterior anatomical study.',
    story:'Two virtual air samples produce different responses in a carbon-dioxide indicator. The first comparison used different air volumes. Can you repair the experiment before accepting the claim?',
    anatomy:'Gas exchange adds carbon dioxide from the blood to alveolar air. Exhaled air generally contains more carbon dioxide than ambient air, but still contains oxygen.',
    mission:'Run the unequal-volume comparison, then rerun with equal volumes and exposure time. Leave the controlled comparison selected.',
    evidence:[['The unequal-volume run changed both sample type and air volume.','Protocol audit'],['A stronger indicator response proves that exhaled air contains no oxygen.','An unsupported assertion'],['The equal-volume run gives a stronger exhaled-sample response; a no-air blank is unchanged.','Controlled result'],['The vials are beside a window.','Room description']],pins:[0,2],
    claims:['A CO₂-sensitive indicator directly measures oxygen concentration.','The controlled comparison supports more CO₂ in the exhaled sample.','Different sample volumes cannot affect a comparison.'],answer:1,
    limits:['The indicator result establishes every gas percentage in the sample.','The test proves that exhaled air has no oxygen.','A CO₂ indicator alone cannot determine oxygen content.'],limit:2,
    solution:'Equal air volumes, equal exposure and a no-air blank make the paired comparison more informative. The relative indicator response supports higher carbon-dioxide content in the exhaled sample. It does not measure oxygen or establish every gas fraction.'
  },
  {
    id:'signal',system:'Circulatory',title:'The missing-pulse recording',method:'Audit a signal against a reference',
    image:'assets/circulatory-missions/01-vessels.webp',alt:'Artery, vein and microvessel teaching studies showing vessels and blood cells.',
    story:'A virtual pulse clip records fewer or extra peaks when signal quality changes. A reference generator sends the same six pulses throughout. Decide whether the recording alone proves the source pulse changed.',
    anatomy:'An optical pulse sensor detects changes associated with peripheral blood volume. Motion and weak peripheral signals can affect a recording without establishing a change in the heart.',
    mission:'Overlay the reference and capture steady, weak-signal and motion-affected comparisons.',
    evidence:[['The reference contains six pulses in every identical comparison window.','Reference log'],['The weak-signal recording misses peaks and the motion recording adds spurious peaks.','Signal comparisons'],['The number of visible clip peaks always proves the source pulse rate.','An untested assertion'],['The clip casing is navy.','Equipment description']],pins:[0,1],
    claims:['Signal quality can change recorded peaks even with the same source pulses.','An extra optical peak always proves an extra heartbeat.','The reference generator changes pulse count between conditions.'],answer:0,
    limits:['A distorted clip trace is enough to diagnose a heart problem.','Recording quality must be checked; this bench example cannot diagnose a real person.','A pulse trace alone establishes blood oxygen concentration.'],limit:1,
    solution:'The unchanged reference and changing clip traces demonstrate a recording-quality problem in this controlled example. Missing or spurious optical peaks do not, by themselves, establish a different heart rhythm or an oxygen reading.'
  },
  {
    id:'sample',system:'Excretory',title:'The concentration trap',method:'Reconstruct a complete collection ledger',
    image:'assets/home-expedition/06-balance.webp',alt:'Kidney cutaway showing cortex, medulla, pelvis and ureter.',
    story:'A lab report claims that the more concentrated urine collection contains more total urea. Both labelled collections cover a complete 24-hour period. Compare concentration with total amount before filing a conclusion.',
    anatomy:'Kidneys remove net urea waste in urine while regulating water. Concentration describes amount per volume; total excretion also depends on the collected volume and time interval.',
    mission:'Inspect both graph views, calculate both whole-collection urea amounts, then choose the correct unit.',
    evidence:[['Collection A: 0.8 L × 25 g/L = 20 g in the complete 24-hour collection.','Collection ledger'],['A higher g/L value alone proves a greater amount was excreted.','An unsupported assertion'],['The collection labels use different letters.','Label description'],['Collection B: 2.0 L × 10 g/L = 20 g in the same complete collection interval.','Collection ledger']],pins:[0,3],
    claims:['Collection A contains twice the total urea simply because it is more concentrated.','Collection B contains no urea because it is more dilute.','Both complete collections contain the same total urea in this example.'],answer:2,
    limits:['These totals alone do not establish filtration rate or diagnose kidney function.','The totals directly measure glomerular filtration rate.','Equal urea totals prove that every aspect of kidney function is identical.'],limit:0,
    solution:'Amount = concentration × volume: both complete 24-hour collections contain 20 g of urea. A per-litre concentration cannot establish total excretion on its own. These two totals do not determine glomerular filtration rate or establish a clinical diagnosis.'
  }
];
