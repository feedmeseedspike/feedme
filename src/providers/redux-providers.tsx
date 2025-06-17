"use client";

import { store, persistor } from "../store/index";
import { Provider } from "react-redux";
import dynamic from "next/dynamic";

const PersistGate = dynamic(
  () =>
    import("redux-persist/integration/react").then((mod) => mod.PersistGate),
  { ssr: false }
);

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
