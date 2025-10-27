import { applyRegex, applyTypeNamesRegex } from "@/lib/matches/applies";
import { useMemo } from "react";
import { useLocalStorage } from "usehooks-ts";

export default function useApplies() {
  const [applies, setApplies] = useLocalStorage("applies", "");
  const [applyTypeNames, setApplyTypeNames] = useLocalStorage(
    "applies-type-names",
    ""
  );

  const applyMap = useMemo(() => {
    const map = new Map<number, string>([]);

    let index = 0;
    for (const apply of applies.matchAll(applyRegex)) {
      if (apply[2]) index = Number(apply[2]);

      map.set(index, apply[1]);
      index++;
    }

    return map;
  }, [applies]);

  const applyTypeNameMap = useMemo(() => {
    const map = new Map<string, string>([]);

    for (const apply of applyTypeNames.matchAll(applyTypeNamesRegex)) {
      map.set(apply[2], apply[1]);
    }

    return map;
  }, [applyTypeNames]);

  return {
    applies,
    setApplies,
    applyMap,
    applyTypeNames,
    setApplyTypeNames,
    applyTypeNameMap,
  };
}
