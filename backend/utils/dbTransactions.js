const mongoose = require('mongoose');

/**
 * Execute an operation within a MongoDB transaction.
 * If running on a standalone development MongoDB instance without a replica set,
 * it safely falls back to standard execution without breaking.
 */
const runInTransaction = async (operation) => {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await operation(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        // Silently continue
      }
    }

    // Standalone mongod fallback
    if (
      error.message &&
      (error.message.includes('replica set member') ||
        error.message.includes('Transaction numbers are only allowed'))
    ) {
      return await operation(null);
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

module.exports = { runInTransaction };
