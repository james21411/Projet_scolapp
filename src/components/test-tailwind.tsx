import '../app/test.css';

export default function TestTailwind() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="md:flex">
          <div className="p-8">
            <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
              Test Tailwind dans Next.js
            </div>
            <p className="mt-2 text-slate-500">
              Si vous voyez ce texte stylé avec des couleurs et une mise en forme, Tailwind CSS fonctionne dans votre application !
            </p>
            <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Bouton Test
            </button>
          </div>
        </div>
      </div>
      
      {/* Test CSS simple */}
      <div className="test-red">
        Test CSS simple - Rouge avec bordure bleue
      </div>
      <div className="test-blue">
        Test CSS simple - Bleu avec bordure rouge
      </div>
    </div>
  );
}
