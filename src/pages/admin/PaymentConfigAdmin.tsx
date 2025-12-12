import { useState, useEffect } from "react";
import { CreditCard, Save, Eye, EyeOff, Heart, Landmark, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BackButton from "@/components/BackButton";

interface PaymentConfig {
  id: string;
  provider: string;
  is_active: boolean;
  config_data: unknown;
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

      // Charger les configs existantes
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
          </TabsTrigger>
          <TabsTrigger value="paypal" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            PayPal
          </TabsTrigger>
          <TabsTrigger value="helloasso" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            HelloAsso
          </TabsTrigger>
          <TabsTrigger value="virement" className="flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            Virement
          </TabsTrigger>
        </TabsList>

        {/* Stripe */}
        <TabsContent value="stripe">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Configuration Stripe
                  </CardTitle>
                  <CardDescription>
                    Clés API et paramètres de connexion Stripe pour les paiements par carte
                  </CardDescription>
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
              <Button onClick={handleSaveStripe} disabled={loading} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Enregistrement...' : 'Enregistrer la configuration Stripe'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PayPal */}
        <TabsContent value="paypal">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Configuration PayPal
                  </CardTitle>
                  <CardDescription>
                    Identifiants API PayPal pour accepter les paiements
                  </CardDescription>
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
              <Button onClick={handleSavePayPal} disabled={loading} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Enregistrement...' : 'Enregistrer la configuration PayPal'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HelloAsso */}
        <TabsContent value="helloasso">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Configuration HelloAsso
                  </CardTitle>
                  <CardDescription>
                    Configurez votre compte HelloAsso pour les dons et adhésions associatifs
                  </CardDescription>
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
                    placeholder="Client Secret HelloAsso"
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
                <p className="text-xs text-muted-foreground">
                  Le slug est la partie de l'URL après helloasso.com/associations/
                </p>
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
              <Button onClick={handleSaveHelloAsso} disabled={loading} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Enregistrement...' : 'Enregistrer la configuration HelloAsso'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Virement bancaire */}
        <TabsContent value="virement">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Landmark className="h-5 w-5" />
                    Coordonnées Bancaires
                  </CardTitle>
                  <CardDescription>
                    Configurez les informations bancaires affichées pour les virements
                  </CardDescription>
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nom de la banque</Label>
                  <Input
                    value={virementConfig.bank_name}
                    onChange={(e) => setVirementConfig({ ...virementConfig, bank_name: e.target.value })}
                    placeholder="Ex: Crédit Agricole"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Titulaire du compte</Label>
                  <Input
                    value={virementConfig.account_holder}
                    onChange={(e) => setVirementConfig({ ...virementConfig, account_holder: e.target.value })}
                    placeholder="Nom de l'association"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>IBAN</Label>
                <Input
                  value={virementConfig.iban}
                  onChange={(e) => setVirementConfig({ ...virementConfig, iban: formatIBAN(e.target.value) })}
                  placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>BIC / SWIFT</Label>
                <Input
                  value={virementConfig.bic}
                  onChange={(e) => setVirementConfig({ ...virementConfig, bic: e.target.value.toUpperCase() })}
                  placeholder="AGRIFRPP"
                  className="font-mono"
                  maxLength={11}
                />
              </div>
              <div className="space-y-2">
                <Label>Instructions personnalisées</Label>
                <Textarea
                  value={virementConfig.instructions}
                  onChange={(e) => setVirementConfig({ ...virementConfig, instructions: e.target.value })}
                  placeholder="Instructions pour le donateur (ex: mentionner votre nom en référence du virement)"
                  rows={3}
                />
              </div>
              <Button onClick={handleSaveVirement} disabled={loading} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Enregistrement...' : 'Enregistrer les coordonnées bancaires'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
