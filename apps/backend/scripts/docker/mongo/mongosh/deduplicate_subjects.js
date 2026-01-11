// Usage: run in mongosh or mongo shell: `mongosh ufabc-matricula deduplicate_subjects.js`

const collectionsToUpdate = [
  { name: 'enrollments', field: 'subject' },
  { name: 'subjectgraduations', field: 'subject' },
  { name: 'comments', field: 'subject' },
  { name: 'components', field: 'subject' },
];

function log(msg) {
  print(new Date().toISOString() + ' - ' + msg);
}

log('Starting deduplication by search field...');

// SAFETY CHECK: Count enrollments and comments before deduplication
const preEnrollmentsCount = db.enrollments.countDocuments();
const preCommentsCount = db.comments.countDocuments();
log(
  `Pre-deduplication: enrollments=${preEnrollmentsCount}, comments=${preCommentsCount}`
);

const duplicateGroups = db.subjects
  .aggregate([
    {
      $group: {
        _id: '$search',
        docs: { $push: '$$ROOT' },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ])
  .toArray();

let totalDuplicates = 0;
let totalUpdated = 0;
let totalDeleted = 0;

for (const group of duplicateGroups) {
  // Sort by createdAt ascending, then by _id as tiebreaker
  const sorted = group.docs.sort((a, b) => {
    const aTime =
      a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
    const bTime =
      b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
    if (aTime < bTime) return -1;
    if (aTime > bTime) return 1;
    return a._id.str < b._id.str ? -1 : 1;
  });
  const canonical = sorted[0];
  const duplicates = sorted.slice(1);
  if (duplicates.length === 0) continue;
  totalDuplicates += duplicates.length;
  log(`Canonical for search='${group._id}': ${canonical._id}`);
  log(`Duplicates: ${duplicates.map((d) => d._id).join(', ')}`);

  // Update references in all related collections
  for (const { name, field } of collectionsToUpdate) {
    const res = db
      .getCollection(name)
      .updateMany(
        { [field]: { $in: duplicates.map((d) => d._id) } },
        { $set: { [field]: canonical._id } }
      );
    if (res.modifiedCount > 0) {
      log(`Updated ${res.modifiedCount} docs in ${name}`);
      totalUpdated += res.modifiedCount;
    }
  }

  // Delete duplicate subjects
  const delRes = db.subjects.deleteMany({
    _id: { $in: duplicates.map((d) => d._id) },
  });
  if (delRes.deletedCount > 0) {
    log(`Deleted ${delRes.deletedCount} duplicate subjects`);
    totalDeleted += delRes.deletedCount;
  }
}

log(
  `Deduplication complete. Duplicates merged: ${totalDuplicates}, References updated: ${totalUpdated}, Subjects deleted: ${totalDeleted}`
);

// SAFETY CHECK: Count enrollments and comments after deduplication
const postEnrollmentsCount = db.enrollments.countDocuments();
const postCommentsCount = db.comments.countDocuments();
log(
  `Post-deduplication: enrollments=${postEnrollmentsCount}, comments=${postCommentsCount}`
);

if (preEnrollmentsCount !== postEnrollmentsCount) {
  log(
    'WARNING: Enrollment count changed! Before: ' +
      preEnrollmentsCount +
      ', After: ' +
      postEnrollmentsCount
  );
} else {
  log('SUCCESS: Enrollment count unchanged.');
}
if (preCommentsCount !== postCommentsCount) {
  log(
    'WARNING: Comments count changed! Before: ' +
      preCommentsCount +
      ', After: ' +
      postCommentsCount
  );
} else {
  log('SUCCESS: Comments count unchanged.');
}

// Optional: create unique index on search
try {
  db.subjects.createIndex({ search: 1 }, { unique: true });
  log('Unique index on search created.');
} catch (e) {
  log('Could not create unique index on search: ' + e.message);
}
