import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface Template {
  name: string;
  description?: string;
  [key: string]: any;
}

interface Props {
  topic?: string;
  value?: Template | null;
  onChange?: (t: Template) => void;
}

const TemplatePicker = ({ topic, value, onChange }: Props) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.post('/api/projects/suggest_templates', { topic: topic || '' });
        const list = res.data.templates || [];
        setTemplates(list);
        if (!value && list.length > 0) onChange && onChange(list[0]);
      } catch (e) {
        console.error('Failed to load templates', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Card className="m-3">
      <CardHeader>
        <CardTitle>Template</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {loading && <div className="text-sm text-muted-foreground">Loading templates...</div>}
          {!loading && templates.length === 0 && <div className="text-sm text-muted-foreground">No templates found</div>}
          <div className="grid grid-cols-1 gap-2">
            {templates.map((t) => (
              <div key={t.name} className="p-2 border rounded hover:shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.description}</div>
                  </div>
                  <div>
                    <Button size="sm" onClick={() => onChange && onChange(t)}>
                      Use
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplatePicker;
