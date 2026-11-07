import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Curated ISSN → Quartile overrides (SCImago / JCR verified) ───────────────
// Overrides publisher-estimated quartile with known real values.
const QUARTILE_MAP = {
  // Computer Science
  '1532-4435': 'Q1', // JMLR
  '1076-9757': 'Q1', // JAIR
  '0162-8828': 'Q1', // IEEE TPAMI
  '2162-237X': 'Q1', // IEEE TNNLS
  '0004-3702': 'Q1', // Artificial Intelligence
  '1057-7149': 'Q1', // IEEE TIP
  '1557-2862': 'Q1', // Theory of Computing
  '0031-3203': 'Q1', // Pattern Recognition
  '0893-6080': 'Q1', // Neural Networks
  '2168-2267': 'Q1', // IEEE TCYB
  '1860-5974': 'Q2', // LMCS
  '0950-7051': 'Q1', // Knowledge-Based Systems
  '0020-0255': 'Q1', // Information Sciences
  '0957-4174': 'Q1', // Expert Systems with Applications
  '1549-6325': 'Q1', // ACM TALG
  '0097-5397': 'Q1', // SICOMP
  // Electrical Engineering
  '0885-8993': 'Q1', // IEEE TPEL
  '0278-0046': 'Q1', // IEEE TIE
  '0090-6778': 'Q1', // IEEE TCOM
  '0733-8716': 'Q1', // IEEE JSAC
  '1536-1276': 'Q1', // IEEE TWC
  '0018-926X': 'Q1', // IEEE TAP
  '1053-587X': 'Q1', // IEEE TSP
  '0885-8950': 'Q1', // IEEE TPWRS
  // Mechanical Engineering
  '0888-3270': 'Q1', // MSSP
  '0017-9310': 'Q1', // IJHMT
  '0022-460X': 'Q1', // JSV
  '1359-4311': 'Q1', // ATE
  '0142-1123': 'Q1', // IJF
  // Biomedical / Medicine
  '0028-4793': 'Q1', // NEJM
  '0140-6736': 'Q1', // The Lancet
  '0098-7484': 'Q1', // JAMA
  '0018-9294': 'Q1', // IEEE TBME
  '0003-4819': 'Q1', // Annals of Internal Medicine
  '0959-8138': 'Q1', // BMJ
  '0033-8419': 'Q1', // Radiology
  // Environmental
  '0013-936X': 'Q1', // ES&T
  '0043-1354': 'Q1', // Water Research
  '0304-3894': 'Q1', // J Hazardous Materials
  '0048-9697': 'Q1', // Science Total Environment
  '1385-8947': 'Q1', // Chemical Engineering Journal
  // Mathematics
  '0003-486X': 'Q1', // Annals of Mathematics
  '0001-5962': 'Q1', // Acta Mathematica
  '0894-0347': 'Q1', // JAMS
  '0012-365X': 'Q2', // Discrete Mathematics
  // Physics
  '0031-9007': 'Q1', // PRL
  '1029-8479': 'Q1', // JHEP
  '0550-3213': 'Q1', // Nuclear Physics B
  '0370-2693': 'Q1', // Physics Letters B
  '0034-6861': 'Q1', // Reviews of Modern Physics
  // MDPI / Open Access known quartiles
  '2076-3417': 'Q2', // Applied Sciences
  '2227-7390': 'Q2', // Mathematics MDPI
  '2071-1050': 'Q2', // Sustainability
  '2079-9292': 'Q2', // Electronics MDPI
  '1996-1073': 'Q2', // Energies
  '2072-4292': 'Q1', // Remote Sensing
  '1999-4893': 'Q2', // Algorithms
  '2227-9059': 'Q2', // Biomedicines
  '1932-6203': 'Q1', // PLOS ONE
  '2169-3536': 'Q2', // IEEE Access
  '2045-2322': 'Q1', // Scientific Reports
  '2405-8440': 'Q2', // Heliyon
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function mapSubjectToDomain(subjects) {
  if (!subjects || subjects.length === 0) return 'Multidisciplinary';

  for (const subject of subjects) {
    const code = (subject.code || '').trim();
    const term = (subject.term || '').toLowerCase();

    if (code.startsWith('QA75') || code.startsWith('QA76') || term.includes('computer science') || term.includes('artificial intelligence') || term.includes('machine learning') || term.includes('software')) return 'Computer Science';
    if (code.startsWith('TK') || term.includes('electrical') || term.includes('electronics') || term.includes('telecommunications')) return 'Electrical Engineering';
    if (code.startsWith('TJ') || term.includes('mechanical') || term.includes('thermodynamics') || term.includes('robotics')) return 'Mechanical Engineering';
    if (code.startsWith('GE') || code.startsWith('TD') || term.includes('environmental') || term.includes('ecology') || term.includes('sustainability')) return 'Environmental Science';
    if (code.startsWith('R') || term.includes('medicine') || term.includes('medical') || term.includes('biomedical') || term.includes('clinical') || term.includes('health') || term.includes('pharmacol') || term.includes('surgery') || term.includes('oncology') || term.includes('neurology') || term.includes('cardiology')) return 'Biomedical / Medicine';
    if (code.startsWith('QA') || term.includes('mathematics') || term.includes('statistics') || term.includes('algebra') || term.includes('calculus')) return 'Mathematics';
    if (code.startsWith('QC') || term.includes('physics') || term.includes('optics') || term.includes('quantum') || term.includes('astrophysics')) return 'Physics';
    if (code.startsWith('QD') || term.includes('chemistry') || term.includes('chemical')) return 'Chemistry';
    if (code.startsWith('QB') || term.includes('astronomy') || term.includes('astrophysics')) return 'Physics';
    if (code.startsWith('QH') || code.startsWith('QK') || code.startsWith('QL') || term.includes('biology') || term.includes('genetics') || term.includes('biochemistry') || term.includes('microbiology') || term.includes('botany') || term.includes('zoology')) return 'Biology';
    if (code.startsWith('TA') || code.startsWith('TE') || code.startsWith('TH') || term.includes('civil engineering') || term.includes('structural') || term.includes('geotechnical')) return 'Civil Engineering';
    if (code.startsWith('TN') || term.includes('materials') || term.includes('metallurgy') || term.includes('mining')) return 'Materials Science';
    if (code.startsWith('TP') || term.includes('chemical engineering') || term.includes('biotechnology') || term.includes('food science')) return 'Chemical Engineering';
    if (code.startsWith('T') || term.includes('engineering') || term.includes('technology')) return 'Engineering';
    if (code.startsWith('Q') || term.includes('science')) return 'Science';
  }

  const firstTerm = subjects[0]?.term;
  return firstTerm || 'Multidisciplinary';
}

// ── Publisher → Indexing heuristic ───────────────────────────────────────────
// Based on known publisher indexing agreements. DOAJ journals must be OA;
// we infer WoS/SCI/SCIE from publisher tier & country.
function buildIndexing(result) {
  const pub = (result.bibjson?.publisher?.name || '').toLowerCase();
  const country = result.bibjson?.publisher?.country || ''; // may be ISO-2 or full name

  // Tier-1 publishers: typically indexed in Scopus + WoS + SCI
  if (/ieee/.test(pub))                                      return ['Scopus', 'WoS', 'SCI'];
  if (/elsevier/.test(pub))                                  return ['Scopus', 'WoS', 'SCI'];
  if (/wiley/.test(pub))                                     return ['Scopus', 'WoS', 'SCI'];
  if (/oxford university press|oup/.test(pub))               return ['Scopus', 'WoS', 'SCI'];
  if (/cambridge university press|cup/.test(pub))            return ['Scopus', 'WoS', 'SCI'];
  if (/american chemical society|acs/.test(pub))             return ['Scopus', 'WoS', 'SCI'];
  if (/american physical society|aps/.test(pub))             return ['Scopus', 'WoS', 'SCI'];
  if (/american medical association|ama/.test(pub))          return ['Scopus', 'WoS', 'SCI'];
  if (/massachusetts medical|nejm/.test(pub))                return ['Scopus', 'WoS', 'SCI'];
  if (/lancet|bmj publishing/.test(pub))                     return ['Scopus', 'WoS', 'SCI'];
  if (/nature publishing|nature portfolio/.test(pub))        return ['Scopus', 'WoS', 'SCI'];
  if (/royal society|rs publishing/.test(pub))               return ['Scopus', 'WoS', 'SCI'];
  if (/american mathematical society|ams/.test(pub))         return ['Scopus', 'WoS', 'SCI'];
  if (/siam/.test(pub))                                      return ['Scopus', 'WoS', 'SCI'];
  if (/plos|public library of science/.test(pub))            return ['Scopus', 'WoS', 'SCI'];
  if (/acm|association for computing/.test(pub))             return ['Scopus', 'WoS', 'SCIE'];

  // Tier-2: Scopus + WoS + SCIE
  if (/springer/.test(pub))                                  return ['Scopus', 'WoS', 'SCIE'];
  if (/mdpi/.test(pub))                                      return ['Scopus', 'WoS', 'SCIE'];
  if (/frontiers/.test(pub))                                 return ['Scopus', 'WoS', 'SCIE'];
  if (/hindawi/.test(pub))                                   return ['Scopus', 'SCIE'];
  if (/biomed central|bmc/.test(pub))                        return ['Scopus', 'WoS', 'SCIE'];
  if (/taylor|routledge|informa/.test(pub))                  return ['Scopus', 'WoS', 'SCIE'];
  if (/sage publications|sage/.test(pub))                    return ['Scopus', 'WoS', 'SCIE'];
  if (/karger/.test(pub))                                    return ['Scopus', 'WoS', 'SCIE'];
  if (/lippincott|wolters kluwer|medknow/.test(pub))         return ['Scopus', 'WoS', 'SCIE'];
  if (/thieme/.test(pub))                                    return ['Scopus', 'WoS', 'SCIE'];
  if (/de gruyter/.test(pub))                                return ['Scopus', 'WoS', 'SCIE'];

  // ISO-2 country codes → indexing level
  // SCI-level countries (major research nations)
  const sciISO  = ['US','GB','NL','DE','CH','FR','JP','AU','CA','SE','DK','BE','AT','NO','FI'];
  // SCIE-level (broader WoS coverage)
  const scieISO = [...sciISO, 'IT','ES','PT','PL','CZ','HU','GR','CN','KR','SG','IL','ZA','BR','MX','IN','TR'];
  // Scopus-only (indexed in Scopus but not necessarily WoS)
  const scopusISO = [...scieISO, 'RO','HR','RS','UA','RU','AR','CO','CL','EG','NG','PK','VN','ID','IR','MY'];

  if (sciISO.includes(country))    return ['Scopus', 'WoS', 'SCI'];
  if (scieISO.includes(country))   return ['Scopus', 'WoS', 'SCIE'];
  if (scopusISO.includes(country)) return ['Scopus'];
  return ['Scopus'];
}

// ── Publisher / subject → Quartile estimator ─────────────────────────────────
function estimateQuartile(result) {
  const pub     = (result.bibjson?.publisher?.name || '').toLowerCase();
  const country = result.bibjson?.publisher?.country || ''; // may be ISO-2

  // Elite publishers → Q1
  const elitePubs = ['elsevier','ieee','wiley','springer','nature','oxford','cambridge',
                     'american chemical','american physical','american medical',
                     'lancet','bmj','plos','acm','royal society','siam',
                     'american mathematical','lippincott','wolters kluwer'];
  if (elitePubs.some(e => pub.includes(e))) return 'Q1';

  // Reputable OA publishers → Q2
  const q2Pubs = ['mdpi','frontiers','biomed central','bmc','taylor','routledge',
                  'sage','hindawi','de gruyter','karger','thieme','informa',
                  'springeropen','copernicus'];
  if (q2Pubs.some(e => pub.includes(e))) return 'Q2';

  // Country-based estimate (ISO-2 codes from DOAJ)
  const q1ISO  = ['US','GB','NL','DE','CH','FR','JP'];
  const q2ISO  = ['CA','AU','SE','DK','BE','AT','NO','FI','IT','ES','KR','SG','IL'];
  const q3ISO  = ['PT','PL','CZ','HU','GR','CN','ZA','BR','MX','IN','TR','RO'];

  if (q1ISO.includes(country)) return 'Q1';
  if (q2ISO.includes(country)) return 'Q2';
  if (q3ISO.includes(country)) return 'Q3';

  return 'Q4';
}

function extractKeywords(result) {
  const stopwords = new Set([
    'the','a','an','and','or','of','in','to','for','with','on','by','from',
    'that','this','are','is','was','be','as','at','has','have','been','which',
    'their','also','can','we','our','its','it','these','those','new','using',
    'used','based','results','data','research','study','studies','paper',
    'method','methods','approach','proposed','show','shown','provide','provides'
  ]);

  const text = (result.bibjson?.aims_scope || result.bibjson?.editorial_review?.process || '').toLowerCase();
  const wordFreq = {};

  if (text) {
    const words = text.split(/\W+/).filter(w => w.length > 2 && !stopwords.has(w));
    for (const word of words) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  }

  const topWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([w]) => w);

  const subjectTerms = (result.bibjson?.subject || []).map(s => s.term).filter(Boolean);
  return [...new Set([...topWords, ...subjectTerms])];
}

function mapResult(result, index) {
  const issn = result.bibjson?.pissn || result.bibjson?.eissn || 'N/A';
  const eissn = result.bibjson?.eissn || 'N/A';

  // Look up real quartile first, fall back to publisher estimate
  const quartile = QUARTILE_MAP[issn] || QUARTILE_MAP[eissn] || estimateQuartile(result);

  return {
    id: String(index + 1),
    type: 'journal',
    title: result.bibjson?.title || 'Unknown',
    abbreviation:
      result.bibjson?.alternative_title ||
      result.bibjson?.title?.split(' ').map(w => w[0]).join('').toUpperCase() ||
      'N/A',
    publisher: result.bibjson?.publisher?.name || 'Unknown',
    issn,
    indexing: buildIndexing(result),
    quartile,
    domain: mapSubjectToDomain(result.bibjson?.subject || []),
    subDomains: (result.bibjson?.subject || []).map(s => s.term).slice(0, 3),
    apc: 'Free',
    url: result.bibjson?.ref?.journal || result.bibjson?.ref?.aims_scope || '#',
    publisher_country: result.bibjson?.publisher?.country || 'Unknown',
    aims:
      result.bibjson?.aims_scope ||
      result.bibjson?.editorial_review?.process ||
      'Aims and scope not available.',
    keywords: extractKeywords(result),
  };
}

// ─── Fallback loader ──────────────────────────────────────────────────────────

function loadFallback() {
  const dataPath = path.join(__dirname, '..', 'public', 'data.json');
  if (fs.existsSync(dataPath)) {
    console.warn('⚠️  Warning: Using fallback data from public/data.json');
    const raw = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(raw).journals || [];
  }
  console.warn('⚠️  Warning: No fallback data found either. Returning empty array.');
  return [];
}

// ─── Crossref enrichment ──────────────────────────────────────────────────────

async function enrichWithCrossref(journals) {
  const email = process.env.CROSSREF_EMAIL;
  if (!email) return journals;

  console.log('Enriching with Crossref (optional)...');
  const enriched = [];

  for (const journal of journals) {
    if (journal.issn && journal.issn !== 'N/A') {
      try {
        const url = `https://api.crossref.org/journals/${journal.issn}`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': `OpenAccessScholar/2.0 (mailto:${email})`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          const subjects = (data.message?.subjects || []).map(s =>
            typeof s === 'string' ? s : s.name || s
          );
          journal.subDomains = [...new Set([...journal.subDomains, ...subjects])].slice(0, 6);
        }
      } catch (err) {
        // non-fatal, skip
      }
      await sleep(100);
    }
    enriched.push(journal);
  }

  return enriched;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // ── 1. Load curated top-tier list ──────────────────────────────────────────
  const curatedPath = path.join(__dirname, 'curated-top-tier.json');
  let curatedList = [];
  try {
    curatedList = JSON.parse(fs.readFileSync(curatedPath, 'utf-8'));
    console.log(`✓ Loaded ${curatedList.length} curated top-tier venues`);
  } catch (e) {
    console.warn('⚠️  Could not load curated-top-tier.json:', e.message);
  }

  // ── 2. Fetch from DOAJ ─────────────────────────────────────────────────────
  const BASE_URL =
    'https://doaj.org/api/search/journals/bibjson.apc.has_apc:false AND bibjson.subject.term:Engineering OR bibjson.subject.term:Computer Science OR bibjson.subject.term:Physics OR bibjson.subject.term:Mathematics OR bibjson.subject.term:Medicine';

  let allResults = [];

  try {
    console.log('Fetching pages 1-5 from DOAJ...');

    const pages = [1, 2, 3, 4, 5];
    const responses = await Promise.all(
      pages.map(p => fetch(`${BASE_URL}?pageSize=100&page=${p}`))
    );

    const dataPages = await Promise.all(
      responses.map(r => r.ok ? r.json() : Promise.resolve({ results: [] }))
    );

    allResults = dataPages.flatMap(d => d.results || []);
    console.log(`Fetched ${allResults.length} journals from DOAJ`);

    if (allResults.length === 0) {
      console.warn('⚠️  DOAJ returned 0 results. Using curated + fallback only.');
      allResults = null;
    }
  } catch (err) {
    console.error('❌ Failed to fetch from DOAJ:', err.message);
    allResults = null;
  }

  // ── 3. Map DOAJ results ────────────────────────────────────────────────────
  let doajJournals = [];
  if (allResults) {
    const mapped = allResults.map((r, i) => mapResult(r, i));
    const filtered = mapped.filter(j => j.title !== 'Unknown');
    doajJournals = filtered.slice(0, 200);
  } else {
    doajJournals = loadFallback();
  }

  // ── 4. Merge: curated first, then DOAJ (deduplicate by ISSN) ──────────────
  console.log('Merging curated top-tier list with DOAJ results...');
  const seen = new Set();

  // Seed seen-set with curated ISSNs so DOAJ dupes are dropped
  for (const j of curatedList) {
    if (j.issn && j.issn !== 'N/A') seen.add(j.issn);
  }

  const uniqueDoaj = doajJournals.filter(j => {
    if (!j.issn || j.issn === 'N/A') return true;
    if (seen.has(j.issn)) return false;
    seen.add(j.issn);
    return true;
  });

  // Curated entries come first (top of list), DOAJ fills the rest
  let journals = [...curatedList, ...uniqueDoaj];

  // Re-assign sequential IDs
  journals = journals.map((j, i) => ({ ...j, id: String(i + 1) }));

  console.log(`✓ Merged: ${curatedList.length} curated + ${uniqueDoaj.length} DOAJ = ${journals.length} total`);

  // ── 5. Crossref enrichment (optional) ─────────────────────────────────────
  journals = await enrichWithCrossref(journals);

  // ── 6. Write output ────────────────────────────────────────────────────────
  const output = {
    lastUpdated: new Date().toISOString(),
    count: journals.length,
    source: 'DOAJ API + Curated Top-Tier List (IEEE, ACM, Nature, SCOAP3, Diamond OA)',
    journals,
  };

  const outPath = path.join(__dirname, '..', 'public', 'data.json');
  console.log('Writing to public/data.json...');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`✅ Done! ${journals.length} venues saved (${curatedList.length} top-tier + ${uniqueDoaj.length} DOAJ).`);
}

main().catch(console.error);
