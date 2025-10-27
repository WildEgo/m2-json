export const groupRegex = /Group\s+([^\n]+)\s*\n\{([^}]*)\}/gim;
export const typeRegex = /Type\t([a-zA-Z]+)/im;
export const vnumRegex = /Vnum\t([a-zA-Z0-9]+)/im;
export const effectRegex = /Effect\t"([^"]*)"/im;
export const normalRegex =
  /([0-9]+)\t([^\t]+)\t([0-9]+)\t([0-9]+)(?:\t([0-9]+))?/gim;
export const attributeRegex = /([0-9]+)\t([0-9]+)\t([0-9]+)/gim;
