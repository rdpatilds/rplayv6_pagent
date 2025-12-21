"use client"

import { InterfaceModeProvider } from "@/context/interface-mode-context"

export default function InterfaceModeWrapper({ children }) {
  return <InterfaceModeProvider>{children}</InterfaceModeProvider>
}
