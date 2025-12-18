import Button from "../ui/Button.jsx";
import ModalBase from "./ModalBase.jsx";

export default function InfoModal({ open, onClose, title = "Info", message = "", actionLabel = "Ok" }) {
  return (
    <ModalBase
      open={open}
      onClose={onClose}
      title={title}
      actions={<Button onClick={onClose}>{actionLabel}</Button>}
    >
      {message}
    </ModalBase>
  );
}
