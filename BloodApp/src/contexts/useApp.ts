import { useContext } from "react";
import { AppContext, type AppContextType } from "./AppContext";

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
