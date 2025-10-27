export const applyRegex = /(APPLY_[a-zA-Z0-9_]+)(?:\s*=\s*(\d+))?\s*,?/gm;
export const applyTypeNamesRegex =
  /"([a-zA-Z0-9_]+)"\s?,\s+?(APPLY_[a-zA-Z_]+)/gim;
