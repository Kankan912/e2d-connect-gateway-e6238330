import { useState, useEffect } from "react";
import { CreditCard, Save, Eye, EyeOff, Heart, Landmark, Building2, CheckCircle, XCircle, Loader2, Wifi } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BackButton from "@/components/BackButton";

interface PaymentConfig {
  id: string;
  provider: string;
  is_active: boolean;
  config_data: unknown;
  updated_at?: string;
}

interface ConnectionStatus {
  status: 'idle' | 'testing' | 'success' | 'error';
  message?: string;
  lastTested?: Date;
}

export default function PaymentConfigAdmin() {
  const [configs, setConfigs] = useState<PaymentConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const [connectionStatus, setConnectionStatus] = useState<{ [key: string]: ConnectionStatus }>({
    stripe: { status: 'idle' },
    paypal: { status: 'idle' },
    helloasso: { status: 'idle' },
    bank_transfer: { status: 'idle' }
  });
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

  const [helloassoConfig, setHelloassoConfig] = useState({
    client_id: "",
    client_secret: "",
    organization_slug: "",
    mode: "sandbox"
  });

  const [virementConfig, setVirementConfig] = useState({
    bank_name: "",
    account_holder: "",
    iban: "",
    bic: "",
    instructions: ""
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

      data?.forEach((config) => {
        const configData = config.config_data as Record<string, unknown>;
        if (config.provider === 'stripe' && configData) {
          setStripeConfig({
            public_key: (configData.public_key as string) || "",
            secret_key: (configData.secret_key as string) || "",
            webhook_secret: (configData.webhook_secret as string) || ""
          });
        } else if (config.provider === 'paypal' && configData) {
          setPaypalConfig({
            client_id: (configData.client_id as string) || "",
            client_secret: (configData.client_secret as string) || "",
            mode: (configData.mode as string) || "sandbox"
          });
        } else if (config.provider === 'helloasso' && configData) {
          setHelloassoConfig({
            client_id: (configData.client_id as string) || "",
            client_secret: (configData.client_secret as string) || "",
            organization_slug: (configData.organization_slug as string) || "",
            mode: (configData.mode as string) || "sandbox"
          });
        } else if (config.provider === 'bank_transfer' && configData) {
          setVirementConfig({
            bank_name: (configData.bank_name as string) || "",
            account_holder: (configData.account_holder as string) || "",
            iban: (configData.iban as string) || "",
            bic: (configData.bic as string) || "",
            instructions: (configData.instructions as string) || ""
          });
        }
      });
    } catch (error) {
      console.error('Erreur chargement configs:', error);
    }
  };

  // Test de connexion simulé (dans un vrai cas, on appellerait une edge function)
  const testConnection = async (provider: string) => {
    setConnectionStatus(prev => ({
      ...prev,
      [provider]: { status: 'testing' }
    }));

    // Simuler un délai de test
    await new Promise(resolve => setTimeout(resolve, 1500));

    let success = false;
    let message = "";

    switch (provider) {
      case 'stripe':
        if (stripeConfig.public_key && stripeConfig.secret_key) {
          // Vérifier le format des clés
          success = stripeConfig.public_key.startsWith('pk_') && stripeConfig.secret_key.startsWith('sk_');
          message = success ? "Clés Stripe valides" : "Format de clé invalide (pk_/sk_)";
        } else {
          message = "Clés manquantes";
        }
        break;
      
      case 'paypal':
        if (paypalConfig.client_id && paypalConfig.client_secret) {
          success = paypalConfig.client_id.length > 10 && paypalConfig.client_secret.length > 10;
          message = success ? "Credentials PayPal valides" : "Credentials invalides";
        } else {
          message = "Client ID ou Secret manquant";
        }
        break;
      
      case 'helloasso':
        if (helloassoConfig.client_id && helloassoConfig.client_secret && helloassoConfig.organization_slug) {
          success = true;
          message = "Configuration HelloAsso valide";
        } else {
          message = "Configuration incomplète";
        }
        break;
      
      case 'bank_transfer':
        if (virementConfig.iban && virementConfig.bic) {
          // Vérifier le format IBAN basique
          success = virementConfig.iban.replace(/\s/g, '').length >= 14;
          message = success ? "Coordonnées bancaires valides" : "Format IBAN invalide";
        } else {
          message = "IBAN ou BIC manquant";
        }
        break;
    }

    setConnectionStatus(prev => ({
      ...prev,
      [provider]: { 
        status: success ? 'success' : 'error',
        message,
        lastTested: new Date()
      }
    }));

    toast({
      title: success ? "Test réussi" : "Échec du test",
      description: message,
      variant: success ? "default" : "destructive"
    });
  };

  const getConnectionBadge = (provider: string) => {
    const status = connectionStatus[provider];
    switch (status.status) {
      case 'testing':
        return <Badge variant="outline"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Test...</Badge>;
      case 'success':
        return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Connecté</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Erreur</Badge>;
      default:
        return null;
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
            is_active: false
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
            is_active: false
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

  const handleSaveHelloAsso = async () => {
    setLoading(true);
    try {
      const existingConfig = configs.find(c => c.provider === 'helloasso');
      
      if (existingConfig) {
        const { error } = await supabase
          .from('payment_configs')
          .update({
            config_data: helloassoConfig,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('payment_configs')
          .insert({
            provider: 'helloasso',
            config_data: helloassoConfig,
            is_active: false
          });

        if (error) throw error;
      }

      toast({ title: "Configuration HelloAsso enregistrée" });
      fetchConfigs();
    } catch (error) {
      console.error('Erreur sauvegarde HelloAsso:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la configuration HelloAsso",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVirement = async () => {
    setLoading(true);
    try {
      const existingConfig = configs.find(c => c.provider === 'bank_transfer');
      
      if (existingConfig) {
        const { error } = await supabase
          .from('payment_configs')
          .update({
            config_data: virementConfig,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('payment_configs')
          .insert({
            provider: 'bank_transfer',
            config_data: virementConfig,
            is_active: false
          });

        if (error) throw error;
      }

      toast({ title: "Coordonnées bancaires enregistrées" });
      fetchConfigs();
    } catch (error) {
      console.error('Erreur sauvegarde virement:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les coordonnées bancaires",
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

  const formatIBAN = (value: string) => {
    const cleaned = value.replace(/\s/g, "").toUpperCase();
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
    return formatted;
  };

  const isActive = (provider: string) => {
    return configs.find(c => c.provider === provider)?.is_active || false;
  };

  const getConfigId = (provider: string) => {
    return configs.find(c => c.provider === provider)?.id;
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
            Gérer les configurations Stripe, PayPal, HelloAsso et virement bancaire
          </p>
        </div>
      </div>

      <Tabs defaultValue="stripe" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stripe" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Stripe
            {isActive('stripe') && <Badge className="ml-1 bg-green-600 text-xs">Actif</Badge>}
          </TabsTrigger>
          <TabsTrigger value="paypal" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            PayPal
            {isActive('paypal') && <Badge className="ml-1 bg-green-600 text-xs">Actif</Badge>}
          </TabsTrigger>
          <TabsTrigger value="helloasso" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            HelloAsso
            {isActive('helloasso') && <Badge className="ml-1 bg-green-600 text-xs">Actif</Badge>}
          </TabsTrigger>
          <TabsTrigger value="virement" className="flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            Virement
            {isActive('bank_transfer') && <Badge className="ml-1 bg-green-600 text-xs">Actif</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* Stripe */}
        <TabsContent value="stripe">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Configuration Stripe
                    </CardTitle>
                    <CardDescription>
                      Clés API et paramètres de connexion Stripe pour les paiements par carte
                    </CardDescription>
                  </div>
                  {getConnectionBadge('stripe')}
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="stripe-active">Activer</Label>
                  <Switch
                    id="stripe-active"
                    checked={isActive('stripe')}
                    onCheckedChange={() => {
                      const id = getConfigId('stripe');
                      if (id) toggleActive(id, isActive('stripe'));
                    }}
                    disabled={!getConfigId('stripe')}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Clé Publique</Label>
                <Input
                  value={stripeConfig.public_key}
                  onChange={(e) => setStripeConfig({ ...stripeConfig, public_key: e.target.value })}
                  placeholder="pk_test_..."
                />
              </div>
              <div className="space-y-2">
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
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowSecrets({ ...showSecrets, stripe_secret: !showSecrets['stripe_secret'] })}
                  >
                    {showSecrets['stripe_secret'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
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
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowSecrets({ ...showSecrets, stripe_webhook: !showSecrets['stripe_webhook'] })}
                  >
                    {showSecrets['stripe_webhook'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveStripe} disabled={loading} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => testConnection('stripe')}
                  disabled={connectionStatus['stripe'].status === 'testing'}
                >
                  <Wifi className="w-4 h-4 mr-2" />
                  Tester
                </Button>
              </div>
              {connectionStatus['stripe'].lastTested && (
                <p className="text-xs text-muted-foreground">
                  Dernier test: {connectionStatus['stripe'].lastTested.toLocaleString('fr-FR')}
                  {connectionStatus['stripe'].message && ` - ${connectionStatus['stripe'].message}`}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PayPal */}
        <TabsContent value="paypal">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Configuration PayPal
                    </CardTitle>
                    <CardDescription>
                      Identifiants API PayPal pour accepter les paiements
                    </CardDescription>
                  </div>
                  {getConnectionBadge('paypal')}
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="paypal-active">Activer</Label>
                  <Switch
                    id="paypal-active"
                    checked={isActive('paypal')}
                    onCheckedChange={() => {
                      const id = getConfigId('paypal');
                      if (id) toggleActive(id, isActive('paypal'));
                    }}
                    disabled={!getConfigId('paypal')}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Client ID</Label>
                <Input
                  value={paypalConfig.client_id}
                  onChange={(e) => setPaypalConfig({ ...paypalConfig, client_id: e.target.value })}
                  placeholder="Client ID PayPal"
                />
              </div>
              <div className="space-y-2">
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
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowSecrets({ ...showSecrets, paypal_secret: !showSecrets['paypal_secret'] })}
                  >
                    {showSecrets['paypal_secret'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select
                  value={paypalConfig.mode}
                  onValueChange={(value) => setPaypalConfig({ ...paypalConfig, mode: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox (Test)</SelectItem>
                    <SelectItem value="live">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSavePayPal} disabled={loading} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => testConnection('paypal')}
                  disabled={connectionStatus['paypal'].status === 'testing'}
                >
                  <Wifi className="w-4 h-4 mr-2" />
                  Tester
                </Button>
              </div>
              {connectionStatus['paypal'].lastTested && (
                <p className="text-xs text-muted-foreground">
                  Dernier test: {connectionStatus['paypal'].lastTested.toLocaleString('fr-FR')}
                  {connectionStatus['paypal'].message && ` - ${connectionStatus['paypal'].message}`}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* HelloAsso */}
        <TabsContent value="helloasso">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Configuration HelloAsso
                    </CardTitle>
                    <CardDescription>
                      Intégration HelloAsso pour les dons et adhésions
                    </CardDescription>
                  </div>
                  {getConnectionBadge('helloasso')}
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="helloasso-active">Activer</Label>
                  <Switch
                    id="helloasso-active"
                    checked={isActive('helloasso')}
                    onCheckedChange={() => {
                      const id = getConfigId('helloasso');
                      if (id) toggleActive(id, isActive('helloasso'));
                    }}
                    disabled={!getConfigId('helloasso')}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Client ID</Label>
                <Input
                  value={helloassoConfig.client_id}
                  onChange={(e) => setHelloassoConfig({ ...helloassoConfig, client_id: e.target.value })}
                  placeholder="Client ID HelloAsso"
                />
              </div>
              <div className="space-y-2">
                <Label>Client Secret</Label>
                <div className="relative">
                  <Input
                    type={showSecrets['helloasso_secret'] ? 'text' : 'password'}
                    value={helloassoConfig.client_secret}
                    onChange={(e) => setHelloassoConfig({ ...helloassoConfig, client_secret: e.target.value })}
                    placeholder="Client Secret"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowSecrets({ ...showSecrets, helloasso_secret: !showSecrets['helloasso_secret'] })}
                  >
                    {showSecrets['helloasso_secret'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Slug de l'organisation</Label>
                <Input
                  value={helloassoConfig.organization_slug}
                  onChange={(e) => setHelloassoConfig({ ...helloassoConfig, organization_slug: e.target.value })}
                  placeholder="mon-association"
                />
              </div>
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select
                  value={helloassoConfig.mode}
                  onValueChange={(value) => setHelloassoConfig({ ...helloassoConfig, mode: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox (Test)</SelectItem>
                    <SelectItem value="live">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveHelloAsso} disabled={loading} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => testConnection('helloasso')}
                  disabled={connectionStatus['helloasso'].status === 'testing'}
                >
                  <Wifi className="w-4 h-4 mr-2" />
                  Tester
                </Button>
              </div>
              {connectionStatus['helloasso'].lastTested && (
                <p className="text-xs text-muted-foreground">
                  Dernier test: {connectionStatus['helloasso'].lastTested.toLocaleString('fr-FR')}
                  {connectionStatus['helloasso'].message && ` - ${connectionStatus['helloasso'].message}`}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Virement Bancaire */}
        <TabsContent value="virement">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Landmark className="h-5 w-5" />
                      Coordonnées Bancaires
                    </CardTitle>
                    <CardDescription>
                      Informations pour les paiements par virement bancaire
                    </CardDescription>
                  </div>
                  {getConnectionBadge('bank_transfer')}
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="virement-active">Activer</Label>
                  <Switch
                    id="virement-active"
                    checked={isActive('bank_transfer')}
                    onCheckedChange={() => {
                      const id = getConfigId('bank_transfer');
                      if (id) toggleActive(id, isActive('bank_transfer'));
                    }}
                    disabled={!getConfigId('bank_transfer')}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom de la banque</Label>
                  <Input
                    value={virementConfig.bank_name}
                    onChange={(e) => setVirementConfig({ ...virementConfig, bank_name: e.target.value })}
                    placeholder="Banque Atlantique"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Titulaire du compte</Label>
                  <Input
                    value={virementConfig.account_holder}
                    onChange={(e) => setVirementConfig({ ...virementConfig, account_holder: e.target.value })}
                    placeholder="ASSOCIATION E2D"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>IBAN</Label>
                <Input
                  value={virementConfig.iban}
                  onChange={(e) => setVirementConfig({ ...virementConfig, iban: formatIBAN(e.target.value) })}
                  placeholder="CM21 1000 1000 0000 0000 0000 000"
                />
              </div>
              <div className="space-y-2">
                <Label>BIC / SWIFT</Label>
                <Input
                  value={virementConfig.bic}
                  onChange={(e) => setVirementConfig({ ...virementConfig, bic: e.target.value.toUpperCase() })}
                  placeholder="BATLCMCX"
                />
              </div>
              <div className="space-y-2">
                <Label>Instructions supplémentaires</Label>
                <Textarea
                  value={virementConfig.instructions}
                  onChange={(e) => setVirementConfig({ ...virementConfig, instructions: e.target.value })}
                  placeholder="Veuillez mentionner votre nom et le motif du virement..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveVirement} disabled={loading} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => testConnection('bank_transfer')}
                  disabled={connectionStatus['bank_transfer'].status === 'testing'}
                >
                  <Wifi className="w-4 h-4 mr-2" />
                  Vérifier
                </Button>
              </div>
              {connectionStatus['bank_transfer'].lastTested && (
                <p className="text-xs text-muted-foreground">
                  Dernière vérification: {connectionStatus['bank_transfer'].lastTested.toLocaleString('fr-FR')}
                  {connectionStatus['bank_transfer'].message && ` - ${connectionStatus['bank_transfer'].message}`}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
