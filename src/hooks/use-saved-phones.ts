// Saved recent recipient phone numbers (localStorage, guest-friendly).
import { useEffect, useState, useCallback } from "react";

const KEY = "eli:saved-phones";
const MAX = 5;

export function useSavedPhones() {
  const [phones, setPhones] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setPhones(JSON.parse(raw));
    } catch {}
  }, []);

  const remember = useCallback((phone: string) => {
    if (!/^0\d{9}$/.test(phone)) return;
    setPhones((prev) => {
      const next = [phone, ...prev.filter((p) => p !== phone)].slice(0, MAX);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const forget = useCallback((phone: string) => {
    setPhones((prev) => {
      const next = prev.filter((p) => p !== phone);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return { phones, remember, forget };
}
