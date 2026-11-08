/**
 * ERP Connections List Page
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ERPConnectionCard } from '@/components/integration';
import { useERPConnections, useCreateERPConnection, useTriggerERPSync } from '@/hooks/integration/useERP';
import { useToast } from '@/hooks/useToast';
import { ERP_TYPES } from '@/types/integration';
import type { ERPType } from '@/types/integration';

export default function ERPList() {
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'SAP' as ERPType,
    host: '',
    port: 443,
    username: '',
    password: '',
  });

  const { toast } = useToast();
  const { data, isLoading, refetch } = useERPConnections();
  const createMutation = useCreateERPConnection();
  const syncMutation = useTriggerERPSync();

  const connections = data?.data || [];

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        name: formData.name,
        type: formData.type,
        config: {
          baseUrl: `https://${formData.host}:${formData.port}`,
          authCredentials: {
            username: formData.username,
            password: formData.password,
          },
        },
      });
      toast({
        title: 'Connection Created',
        description: 'ERP connection has been created successfully.',
      });
      setShowNewDialog(false);
      setFormData({
        name: '',
        type: 'SAP',
        host: '',
        port: 443,
        username: '',
        password: '',
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create ERP connection.',
        variant: 'destructive',
      });
    }
  };

  const handleSync = async (connectionId: string) => {
    setSyncingId(connectionId);
    try {
      await syncMutation.mutateAsync({ id: connectionId, data: { entityType: 'ALL' } });
      toast({
        title: 'Sync Started',
        description: 'ERP sync has been initiated.',
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: 'Failed to start ERP sync.',
        variant: 'destructive',
      });
    } finally {
      setSyncingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ERP Connections</h1>
          <p className="text-muted-foreground">
            Manage connections to SAP, Oracle, and other ERP systems
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Connection
          </Button>
        </div>
      </div>

      {/* Connections Grid */}
      {connections.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No ERP Connections</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first ERP connection
              </p>
              <Button onClick={() => setShowNewDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {connections.map((connection) => (
            <Link key={connection.id} to={`/integration/erp/${connection.id}`}>
              <ERPConnectionCard
                connection={connection}
                onSync={() => handleSync(connection.id)}
                onEdit={() => {}}
                isSyncing={syncingId === connection.id}
              />
            </Link>
          ))}
        </div>
      )}

      {/* New Connection Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add ERP Connection</DialogTitle>
            <DialogDescription>
              Configure a new connection to your ERP system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Connection Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Production SAP"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">ERP Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: ERPType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ERP_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="host">Host</Label>
                <Input
                  id="host"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  placeholder="lerp.example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name || !formData.host || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Connection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
