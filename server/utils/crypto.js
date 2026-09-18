import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.ENCRYPTION_KEY || "chatrix-edu-secret-key-2024";

export function decryptMessage(ciphertext) {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || ciphertext;
  } catch {
    return ciphertext;
  }
}