import Button from "../ui/Button.jsx";
import ModalBase from "./ModalBase.jsx";

export default function ErrorModal({ open, onClose, title = "Hiba", message = "" }) {
  return (
    <ModalBase
      open={open}
      onClose={onClose}
      title={title}
      actions={
        <Button variant="ghost" onClick={onClose}>
          Rendben
        </Button>
      }
    >
      {message}
    </ModalBase>
  );
}
