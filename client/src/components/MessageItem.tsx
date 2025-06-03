
function Spinner() {
  return (
    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 opacity-50 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
  );
}

interface MessageItemProps {
  type: "user" | "assistant";
  content: string;
  streaming: boolean;
}
export function MessageItem(props: MessageItemProps) {
  const { type, content, streaming } = props;
  return (
    <div
      className={`p-2 rounded break-words min-h-[2em] ${
        type === "user"
          ? "bg-blue-100 text-blue-800 self-end"
          : "bg-gray-200 text-gray-800 self-start"
      }`}
    >
      {content ? content : streaming ? <Spinner /> : ""}
    </div>
  );
}
