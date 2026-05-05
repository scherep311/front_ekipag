// src/pages/Auth/phoneUtils.js
// Shared phone mask utilities used across all auth pages.

export function applyPhoneMask(raw) {
  let digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("8")) digits = "7" + digits.slice(1);
  else if (!digits.startsWith("7")) digits = "7" + digits;
  digits = digits.slice(0, 11);
  const d = digits.slice(1);
  if (!d.length) return "";
  let result = `+7 (${d.slice(0, 3)}`;
  if (d.length < 3) return result;
  result += `) ${d.slice(3, 6)}`;
  if (d.length < 6) return result;
  result += `-${d.slice(6, 8)}`;
  if (d.length < 8) return result;
  result += `-${d.slice(8, 10)}`;
  return result;
}

export function phoneToServer(masked) {
  return masked.replace(/\D/g, "");
}

/**
 * Builds a phone onChange handler with correct cursor restoration.
 * @param {Function} setPhone - state setter
 * @param {object}   ref      - React ref pointing to the <input> element
 * @param {Function} onClear  - optional callback to clear phone error
 */
export function makePhoneHandler(setPhone, ref, onClear) {
  return function handlePhoneChange(e) {
    const input = e.target;
    const rawVal = input.value;
    const pos = input.selectionStart ?? rawVal.length;

    // Count digits before cursor in the browser value (before mask is applied)
    let digitsBefore = 0;
    for (let i = 0; i < pos; i++) {
      if (/\d/.test(rawVal[i])) digitsBefore++;
    }

    const masked = applyPhoneMask(rawVal);
    setPhone(masked);
    if (onClear) onClear();

    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;

      if (digitsBefore === 0) {
        el.setSelectionRange(0, 0);
        return;
      }

      // If the raw input doesn't start with "7" or "8", applyPhoneMask prepends
      // an extra "7" digit. Shift the target digit index by 1 to compensate.
      const rawDigits = rawVal.replace(/\D/g, "");
      const maskPrepended7 =
        rawDigits.length > 0 &&
        !rawDigits.startsWith("7") &&
        !rawDigits.startsWith("8");
      const target = digitsBefore + (maskPrepended7 ? 1 : 0);

      let seen = 0;
      for (let i = 0; i < masked.length; i++) {
        if (/\d/.test(masked[i])) {
          seen++;
          if (seen === target) {
            el.setSelectionRange(i + 1, i + 1);
            return;
          }
        }
      }
      el.setSelectionRange(masked.length, masked.length);
    });
  };
}
