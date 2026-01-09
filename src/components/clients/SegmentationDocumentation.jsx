import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEGMENT_MAPPING, COMPLEXITY_OPTIONS, APPLICATIONS } from '@/components/utils/segmentMapping';
import { BookOpen } from 'lucide-react';

export default function SegmentationDocumentation() {
  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5" />
        <h2 className="text-lg font-bold">Documentação de Segmentação</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Segmentos de Atuação (17 categorias)</CardTitle>
          <CardDescription>Mapeamento para BI e automações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-2">
            {Object.entries(SEGMENT_MAPPING).map(([segment, code]) => (
              <div key={code} className="p-2 border rounded bg-slate-50 text-sm">
                <div className="font-semibold">{segment}</div>
                <Badge variant="outline" className="text-[10px] mt-1">{code}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Porte / Complexidade (opcional)</CardTitle>
          <CardDescription>3 níveis de classificação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {COMPLEXITY_OPTIONS.map(opt => (
            <div key={opt} className="p-2 border rounded bg-slate-50">
              <span className="font-medium">{opt}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aplicações Principais (multiselect)</CardTitle>
          <CardDescription>Até 7 aplicações por cliente</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-2">
          {APPLICATIONS.map(app => (
            <div key={app} className="p-2 border rounded bg-slate-50 text-sm">
              {app}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Implementação BI & APIs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800">
          <p>✓ Todos os campos são exportáveis via CSV com códigos</p>
          <p>✓ Campo <code className="bg-white px-1 rounded">segment_code</code> preenchido automaticamente</p>
          <p>✓ Filtros disponíveis: Segmento, Complexidade, Aplicações</p>
          <p>✓ Relatórios podem agrupar por <code className="bg-white px-1 rounded">segment_code</code></p>
        </CardContent>
      </Card>
    </div>
  );
}