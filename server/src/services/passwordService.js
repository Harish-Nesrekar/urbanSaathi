
const argon2 = require("argon2");
const bcrypt = require("bcrypt");

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

const hashPassword = async (password) => {
  return argon2.hash(password, ARGON2_OPTIONS);
};

const verifyPassword = async (storedHash, password) => {
  if (
    typeof storedHash !== "string" ||
    typeof password !== "string"
  ) {
    return {
      valid: false,
      needsRehash: false,
    };
  }

  try {
    if (storedHash.startsWith("$argon2id$")) {
      const valid = await argon2.verify(storedHash, password);

      return {
        valid,
        needsRehash:
          valid && argon2.needsRehash(storedHash, ARGON2_OPTIONS),
      };
    }

    // Support existing bcrypt accounts during migration.
    if (/^\$2[aby]\$/.test(storedHash)) {
      const valid = await bcrypt.compare(password, storedHash);

      return {
        valid,
        needsRehash: valid,
      };
    }

    return {
      valid: false,
      needsRehash: false,
    };
  } catch (error) {
    // Malformed hashes must never authenticate a user.
    return {
      valid: false,
      needsRehash: false,
    };
  }
};

module.exports = {
  hashPassword,
  verifyPassword,
};
