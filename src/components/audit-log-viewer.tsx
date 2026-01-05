import { useEffect, useState } from "react";
import { getAuditLogs, type AuditLogEntry } from "@/services/auditLogService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Download, FileText, Calendar, User, Activity } from "lucide-react";
import jsPDF from "jspdf";

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    const offset = (page - 1) * pageSize;
    const logs = await getAuditLogs(pageSize, offset, startDate || undefined, endDate || undefined);
    setLogs(logs);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line
  }, [page, pageSize, startDate, endDate]);

  const filteredLogs = logs.filter(log =>
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    (log.username || "").toLowerCase().includes(search.toLowerCase()) ||
    (log.details || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    const header = "Date,Action,Utilisateur,Détails\n";
    const rows = filteredLogs.map(log =>
      `"${new Date(log.timestamp).toLocaleString()}","${log.action}","${log.username || log.userId || "-"}","${log.details.replace(/"/g, '""')}"`
    ).join("\n");
    const csv = header + rows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Journal d'audit", 10, 10);
    doc.setFontSize(10);
    let y = 20;
    doc.text("Date | Action | Utilisateur | Détails", 10, y);
    y += 8;
    filteredLogs.forEach(log => {
      const line = `${new Date(log.timestamp).toLocaleString()} | ${log.action} | ${log.username || log.userId || "-"} | ${log.details}`;
      doc.text(line, 10, y);
      y += 8;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    doc.save("audit-logs.pdf");
  };

  return (
    <div className="space-y-6">
      {/* Filtres et contrôles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Filtrer par action, utilisateur ou détails..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input 
                  type="date" 
                  value={startDate} 
                  onChange={e => { setPage(1); setStartDate(e.target.value); }} 
                  className="w-40" 
                />
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input 
                  type="date" 
                  value={endDate} 
                  onChange={e => { setPage(1); setEndDate(e.target.value); }} 
                  className="w-40" 
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exporter CSV
            </Button>
            <Button onClick={handleExportPDF} variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Exporter PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Journal d'Audit ({filteredLogs.length} entrées)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Chargement...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Aucun log trouvé
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.action}</Badge>
                    </TableCell>
                    <TableCell>{log.username || log.userId || "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {page} - {filteredLogs.length} entrées
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                variant="outline"
                size="sm"
              >
                Précédent
              </Button>
              <Button 
                onClick={() => setPage(p => p + 1)} 
                disabled={logs.length < pageSize}
                variant="outline"
                size="sm"
              >
                Suivant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 