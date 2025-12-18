import Button from "../ui/Button.jsx";
import ModalBase from "./ModalBase.jsx";

export default function ConfirmModal({ open, title = "Megerősítés", message = "", onConfirm, onCancel }) {
  return (
    <ModalBase
      open={open}
      onClose={onCancel}
      title={title}
      actions={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Mégse
          </Button>
          <Button onClick={onConfirm}>Rendben</Button>
        </>
      }
    >
      {message}
    </ModalBase>
  );
}
