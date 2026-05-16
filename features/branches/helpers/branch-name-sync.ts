import {
  hasHindiText,
  hasLatinText,
  toEnglishName,
  toHindiName,
} from "@/features/branches/helpers/branch-transliteration";
import type { BranchFormValues } from "@/features/branches/types/branch-form.types";

// Keeps Hindi and English names paired after the user leaves either field.
export function syncBranchNameFields(
  values: BranchFormValues,
  changedName: keyof BranchFormValues,
) {
  if (changedName === "nameHi" && hasLatinText(values.nameHi)) {
    return {
      ...values,
      nameEn: values.nameHi,
      nameHi: toHindiName(values.nameHi),
    };
  }

  if (changedName === "nameHi" && hasHindiText(values.nameHi)) {
    return { ...values, nameEn: toEnglishName(values.nameHi) };
  }

  if (changedName === "nameEn" && hasHindiText(values.nameEn)) {
    return {
      ...values,
      nameEn: toEnglishName(values.nameEn),
      nameHi: values.nameEn,
    };
  }

  if (changedName === "nameEn" && hasLatinText(values.nameEn)) {
    return { ...values, nameHi: toHindiName(values.nameEn) };
  }

  return values;
}
