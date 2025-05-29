import Sidebar from './Sidebar';
import ChatArea from './ChatArea';

export default function Home() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <ChatArea />
    </div>
  );
}