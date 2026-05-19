import { useEffect, useMemo, useState } from "react";
import { getPerfumes } from "@/services/perfumes";
import { useOnboardingStore } from "@/stores/useOnboardingStore";
import type { GenderPreference, Perfume } from "@/utils/types";

const ONBOARDING_CATALOG_LIMIT = 1200;

function matchesSelectedGender(perfume: Perfume, genderPreference?: GenderPreference) {
  if (!genderPreference) return true;
  if (genderPreference === "men") return perfume.gender === "men";
  if (genderPreference === "women") return perfume.gender === "women";
  return perfume.gender === "unisex";
}

export function useOnboardingCatalog(searchQuery = "") {
  const catalogPerfumes = useOnboardingStore((s) => s.catalogPerfumes);
  const setCatalogPerfumes = useOnboardingStore((s) => s.setCatalogPerfumes);
  const genderPreference = useOnboardingStore((s) => s.genderPreference);
  const [loading, setLoading] = useState(catalogPerfumes.length === 0);

  useEffect(() => {
    let cancelled = false;

    if (catalogPerfumes.length > 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getPerfumes(ONBOARDING_CATALOG_LIMIT)
      .then((perfumes) => {
        if (cancelled) return;
        setCatalogPerfumes(perfumes);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [catalogPerfumes.length, setCatalogPerfumes]);

  const perfumes = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    const filteredByGender = catalogPerfumes.filter((perfume) => matchesSelectedGender(perfume, genderPreference));

    if (!normalized) return filteredByGender;

    return filteredByGender.filter((perfume) =>
      `${perfume.name} ${perfume.brand} ${perfume.families.join(" ")} ${(perfume.perfumers ?? []).join(" ")}`.toLowerCase().includes(normalized),
    );
  }, [catalogPerfumes, genderPreference, searchQuery]);

  return {
    loading,
    perfumes: perfumes as Perfume[],
  };
}
