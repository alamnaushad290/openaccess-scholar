const fs = require('fs');
const path = require('path');

export const config = { api: { bodyParser: false } };

export default function handler(req, res) {
  const dataPath = path.join(process.cwd(), 'public', 'data.json');

  let raw;
  try {
    raw = fs.readFileSync(dataPath, 'utf-8');
  } catch (err) {
    return res.status(503).json({
      error: 'Data not yet available. Run fetch-journals script.',
    });
  }

  const { lastUpdated, count: _count, source, journals: allJournals = [] } = JSON.parse(raw);

  const { search = '', domain = '', indexing = '', type = '', quartile = '' } = req.query;

  let filtered = allJournals;

  if (type) {
    filtered = filtered.filter(j => j.type === type);
  }

  if (domain) {
    filtered = filtered.filter(j =>
      j.domain?.toLowerCase().includes(domain.toLowerCase())
    );
  }

  if (indexing) {
    filtered = filtered.filter(j =>
      Array.isArray(j.indexing)
        ? j.indexing.some(idx => idx.toLowerCase().includes(indexing.toLowerCase()))
        : false
    );
  }

  if (quartile) {
    filtered = filtered.filter(j =>
      j.quartile?.toLowerCase() === quartile.toLowerCase()
    );
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(j =>
      j.title?.toLowerCase().includes(q) ||
      j.publisher?.toLowerCase().includes(q) ||
      j.domain?.toLowerCase().includes(q) ||
      j.aims?.toLowerCase().includes(q) ||
      (Array.isArray(j.keywords) && j.keywords.some(k => k.toLowerCase().includes(q))) ||
      (Array.isArray(j.subDomains) && j.subDomains.some(s => s.toLowerCase().includes(q)))
    );
  }

  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  return res.status(200).json({
    lastUpdated,
    source,
    count: filtered.length,
    journals: filtered,
  });
}
