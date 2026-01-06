export default function About() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6 drop-shadow-md">About SafeChat360</h1>
      <div className="bg-white/90 backdrop-blur-md shadow-lg p-8 rounded-2xl">
        <p className="text-slate-800 text-lg leading-relaxed">
          SafeChat360 is a demonstration of a comprehensive content moderation dashboard.
          It integrates advanced filters for text, image, and audio moderation to create safe online communities.
        </p>
        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-800">
          <strong>Note:</strong> This is a secure environment. All actions are logged.
        </div>
      </div>
    </div>
  );
}
