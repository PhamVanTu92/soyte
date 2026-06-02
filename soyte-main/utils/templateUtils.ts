export const romanize = (num: number) => {
  if (isNaN(num)) return "NaN";
  const digits = String(+num).split(""),
    key = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM",
      "", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC",
      "", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
  let roman = "", i = 3;
  while (i--) roman = (key[+digits.pop()! + (i * 10)] || "") + roman;
  return Array(+digits.join("") + 1).join("M") + roman;
};

export const getGroupIndexString = (index: number, romanType: "number" | "roman" = "roman") => {
  if (romanType === "number") {
    return String.fromCharCode(65 + index);
  }
  return romanize(index + 1);
};

export const getOptionIndexString = (groupIndex: number, optIndex: number, romanType: "number" | "roman" = "roman", globalIndex: number = optIndex + 1) => {
  if (romanType === "number") {
    return `${String.fromCharCode(65 + groupIndex)}${optIndex + 1}`;
  }
  return `${globalIndex}`;
};

export const normalizeValue = (val: string) => {
     return val.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, '_').toLowerCase();
};
