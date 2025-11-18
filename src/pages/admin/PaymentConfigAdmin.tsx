import { useState, useEffect } from "react";
import { Settings, CreditCard, Save, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BackButton from "@/components/BackButton";

interface PaymentConfig {
  id: string;
  provider: string;
  is_active: boolean;
  config_data: any;
}

export default function PaymentConfigAdmin() {
  const [configs, setConfigs] = useState<PaymentConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  const [stripeConfig, setStripeConfig] = useState({
    public_key: "",
    secret_key: "",
    webhook_secret: ""
  });

  const [paypalConfig, setPaypalConfig] = useState({
    client_id: "",
    client_secret: "",
    mode: "sandbox"
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_configs')
        .select('*');

      if (error) throw error;
      setConfigs(data || []);

      // Charger les configs existantes
      data?.forEach((config) => {
        if (config.provider === 'stripe' && config.config_data && typeof config.config_data === 'object') {
          setStripeConfig(config.config_data as any);
        } else if (config.provider === 'paypal' && config.config_data && typeof config.config_data === 'object') {
          setPaypalConfig(config.config_data as any);
        }
      });
    } catch (error) {
      console.error('Erreur chargement configs:', error);
    }
  };

  const handleSaveStripe = async () => {
    setLoading(true);
    try {
      const existingConfig = configs.find(c => c.provider === 'stripe');
      
      if (existingConfig) {
        const { error } = await supabase
          .from('payment_configs')
          .update({
            config_data: stripeConfig,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('payment_configs')
          .insert({
            provider: 'stripe',
            config_data: stripeConfig,
            is_active: true
          });

        if (error) throw error;
      }

      toast({ title: "Configuration Stripe enregistrée" });
      fetchConfigs();
    } catch (error) {
      console.error('Erreur sauvegarde Stripe:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la configuration Stripe",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePayPal = async () => {
    setLoading(true);
    try {
      const existingConfig = configs.find(c => c.provider === 'paypal');
      
      if (existingConfig) {
        const { error } = await supabase
          .from('payment_configs')
          .update({
            config_data: paypalConfig,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('payment_configs')
          .insert({
            provider: 'paypal',
            config_data: paypalConfig,
            is_active: true
          });

        if (error) throw error;
      }

      toast({ title: "Configuration PayPal enregistrée" });
      fetchConfigs();
    } catch (error) {
      console.error('Erreur sauvegarde PayPal:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la configuration PayPal",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('payment_configs')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      fetchConfigs();
      toast({ title: `Configuration ${!isActive ? 'activée' : 'désactivée'}` });
    } catch (error) {
      console.error('Erreur toggle:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <BackButton />
          <h1 className="text-3xl font-bold mt-4 flex items-center gap-2">
            <CreditCard className="h-8 w-8" />
            Configuration des Paiements
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérer les configurations Stripe, PayPal et autres méthodes de paiement
          </p>
        </div>
      </div>

      <Tabs defaultValue="stripe" className="space-y-6">
        <TabsList>
          <TabsTrigger value="stripe">Stripe</TabsTrigger>
          <TabsTrigger value="paypal">PayPal</TabsTrigger>
          <TabsTrigger value="helloasso">HelloAsso</TabsTrigger>
          <TabsTrigger value="virement">Virement</TabsTrigger>
        </TabsList>

        <TabsContent value="stripe">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Configuration Stripe</CardTitle>
                  <CardDescription>
                    Clés API et paramètres de connexion Stripe
                  </CardDescription>
                </div>
                {configs.find(c => c.provider === 'stripe') && (
                  <Switch
                    checked={configs.find(c => c.provider === 'stripe')?.is_active}
                    onCheckedChange={() => {
                      const config = configs.find(c => c.provider === 'stripe');
                      if (config) toggleActive(config.id, config.is_active);
                    }}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Clé Publique</Label>
                <Input
                  value={stripeConfig.public_key}
                  onChange={(e) => setStripeConfig({ ...stripeConfig, public_key: e.target.value })}
                  placeholder="pk_test_..."
                />
              </div>
              <div>
                <Label>Clé Secrète</Label>
                <div className="relative">
                  <Input
                    type={showSecrets['stripe_secret'] ? 'text' : 'password'}
                    value={stripeConfig.secret_key}
                    onChange={(e) => setStripeConfig({ ...stripeConfig, secret_key: e.target.value })}
                    placeholder="sk_test_..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0"
                    onClick={() => setShowSecrets({ ...showSecrets, stripe_secret: !showSecrets['stripe_secret'] })}
                  >
                    {showSecrets['stripe_secret'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label>Webhook Secret</Label>
                <div className="relative">
                  <Input
                    type={showSecrets['stripe_webhook'] ? 'text' : 'password'}
                    value={stripeConfig.webhook_secret}
                    onChange={(e) => setStripeConfig({ ...stripeConfig, webhook_secret: e.target.value })}
                    placeholder="whsec_..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0"
                    onClick={() => setShowSecrets({ ...showSecrets, stripe_webhook: !showSecrets['stripe_webhook'] })}
                  >
                    {showSecrets['stripe_webhook'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button onClick={handleSaveStripe} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paypal">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Configuration PayPal</CardTitle>
                  <CardDescription>
                    Identifiants API PayPal
                  </CardDescription>
                </div>
                {configs.find(c => c.provider === 'paypal') && (
                  <Switch
                    checked={configs.find(c => c.provider === 'paypal')?.is_active}
                    onCheckedChange={() => {
                      const config = configs.find(c => c.provider === 'paypal');
                      if (config) toggleActive(config.id, config.is_active);
                    }}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Client ID</Label>
                <Input
                  value={paypalConfig.client_id}
                  onChange={(e) => setPaypalConfig({ ...paypalConfig, client_id: e.target.value })}
                  placeholder="Client ID PayPal"
                />
              </div>
              <div>
                <Label>Client Secret</Label>
                <div className="relative">
                  <Input
                    type={showSecrets['paypal_secret'] ? 'text' : 'password'}
                    value={paypalConfig.client_secret}
                    onChange={(e) => setPaypalConfig({ ...paypalConfig, client_secret: e.target.value })}
                    placeholder="Client Secret"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0"
                    onClick={() => setShowSecrets({ ...showSecrets, paypal_secret: !showSecrets['paypal_secret'] })}
                  >
                    {showSecrets['paypal_secret'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label>Mode</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Switch
                    checked={paypalConfig.mode === 'live'}
                    onCheckedChange={(checked) => setPaypalConfig({ ...paypalConfig, mode: checked ? 'live' : 'sandbox' })}
                  />
                  <Label>{paypalConfig.mode === 'live' ? 'Production' : 'Sandbox'}</Label>
                </div>
              </div>
              <Button onClick={handleSavePayPal} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="helloasso">
          <Card>
            <CardHeader>
              <CardTitle>Configuration HelloAsso</CardTitle>
              <CardDescription>À venir</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                La configuration HelloAsso sera disponible prochainement
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="virement">
          <Card>
            <CardHeader>
              <CardTitle>Informations Bancaires</CardTitle>
              <CardDescription>À venir</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Configuration des informations pour virement bancaire
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
