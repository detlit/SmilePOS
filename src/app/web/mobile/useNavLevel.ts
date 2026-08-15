import { useState, useEffect } from 'react';
import axios from 'axios';

export function useNavLevel() {
  const [navLevel, setNavLevel] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLevel = async () => {
      if (typeof window === 'undefined') return;
      const companyS = localStorage.getItem("company_") || "";
      if (!companyS) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await axios.get(`/api/level?company=${companyS}`);
        setNavLevel(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLevel();
  }, []);

  const isNavVisible = (codename: string): boolean => {
    if (typeof window === 'undefined') return false;
    // Hide all navigation while loading
    if (isLoading) return false;
    const userLevel = localStorage.getItem("level_") || "";
    // level2 (owner) always has access
    if (userLevel === "level2") return true;
    // Check employee-level overrides first
    try {
      const empRaw = localStorage.getItem("emp_permissions");
      if (empRaw) {
        const empPerms: { codename: string; allowed: boolean }[] = JSON.parse(empRaw);
        const override = empPerms.find(p => p.codename === codename);
        if (override) return override.allowed;
      }
    } catch {}
    // Fall back to global level data
    if (navLevel.length === 0) return userLevel !== "level1";
    const found = navLevel.filter((a: any) => a.codename === codename);
    if (found.length === 0) return userLevel !== "level1";
    if (userLevel === "level1") return found[0].level1 !== false;
    if (userLevel === "level3") return found[0].level3 !== false;
    return true;
  };

  return { navLevel, isNavVisible, isLoading };
}
