import { createContext, useContext, useMemo, useState } from "react";
import InfoModal from "../components/modals/InfoModal.jsx";
import ErrorModal from "../components/modals/ErrorModal.jsx";
import ConfirmModal from "../components/modals/ConfirmModal.jsx";

const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
  const [modal, setModal] = useState({ type: null, payload: null });

  const close = () => setModal({ type: null, payload: null });

  const showInfo = (payload) => setModal({ type: "info", payload });
  const showError = (payload) => setModal({ type: "error", payload });
  const showConfirm = (payload) =>
    new Promise((resolve) => {
      setModal({
        type: "confirm",
        payload: {
          ...payload,
          onConfirm: () => {
            close();
            resolve(true);
          },
          onCancel: () => {
            close();
            resolve(false);
          },
        },
      });
    });

  const value = useMemo(() => ({ showInfo, showError, showConfirm, close }), []);

  return (
    <ModalContext.Provider value={value}>
      {children}
      <InfoModal open={modal.type === "info"} onClose={close} {...modal.payload} />
      <ErrorModal open={modal.type === "error"} onClose={close} {...modal.payload} />
      <ConfirmModal open={modal.type === "confirm"} {...modal.payload} />
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
};
