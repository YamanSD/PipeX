import { useEffect, useState } from "react";
import { LocalStorage } from "../../services";
import "./styles.css";

/**
 * Interface type for the component.
 */
interface Props {
  text: string;
  sender: string;
  createdAt: number;
  directed: boolean;
  receiver?: string;
}

/**
 * @param props property types for the component.
 * @constructor
 */
export default function ChatMessage(props: Props) {
  const [senderName, setSenderName] = useState("");
  const { text, sender, createdAt, directed, receiver } = props;
  const currentUser = LocalStorage.getUser();
  const messageType = sender === currentUser?.uid ? "sent" : "received";

  useEffect(() => {
      setSenderName(sender);
  }, [sender]);

  return (
    <>
      {(
        <div className={`message ${messageType}`}>
          <div className={`message__content ${messageType}__content`}>
            <div className={`message__content__sender`}>{senderName}</div>
            <div className="message__content__text">{text}</div>
            <div className={`message__content__at ${directed ? "directed" : ""}`}>
              <p>
                {`${directed ? (messageType === "sent" ? `to: ${receiver}` : `Private`) : ""}`}
              </p>
              <p>
                {`${toDateTime(createdAt)}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function toDateTime(ms: number) {
  let t = new Date(ms); // Epoch

  let hours = t.getHours();
  let minutes: number | string = t.getMinutes();
  let ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes;

  return hours + ':' + minutes + ampm;
}
