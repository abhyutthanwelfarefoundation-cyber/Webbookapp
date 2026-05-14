export default function Loader({ fullscreen = false, text = 'Loading...' }) {
  const content = (
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
        {content}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-16">{content}</div>;
}
