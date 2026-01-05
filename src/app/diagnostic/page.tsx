import DatabaseDiagnostic from '@/components/db-diagnostic';

export default function DiagnosticPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Diagnostic de la Base de Données</h1>
        <DatabaseDiagnostic />
      </div>
    </div>
  );
} 