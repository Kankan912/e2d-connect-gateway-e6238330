import { CreditCard, DollarSign, Building2, Heart, Smartphone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PaymentConfig } from "@/types/donations";

interface PaymentMethodTabsProps {
  activeConfigs: PaymentConfig[];
  children: React.ReactNode;
}

const PaymentMethodTabs = ({ activeConfigs, children }: PaymentMethodTabsProps) => {
  const getIcon = (provider: string) => {
    switch (provider) {
      case 'stripe':
        return <CreditCard className="w-4 h-4" />;
      case 'paypal':
        return <DollarSign className="w-4 h-4" />;
      case 'helloasso':
        return <Heart className="w-4 h-4" />;
      case 'bank_transfer':
        return <Building2 className="w-4 h-4" />;
      case 'orange_money':
        return <span className="text-base leading-none">🟠</span>;
      case 'mtn_money':
        return <span className="text-base leading-none">🟡</span>;
      default:
        return <Smartphone className="w-4 h-4" />;
    }
  };

  const getLabel = (provider: string) => {
    switch (provider) {
      case 'stripe':
        return 'Carte bancaire';
      case 'paypal':
        return 'PayPal';
      case 'helloasso':
        return 'HelloAsso';
      case 'bank_transfer':
        return 'Virement';
      case 'orange_money':
        return 'Orange Money';
      case 'mtn_money':
        return 'MTN MoMo';
      default:
        return provider;
    }
  };

  if (activeConfigs.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/50 rounded-lg">
        <p className="text-muted-foreground">
          Aucune méthode de paiement n'est actuellement configurée.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Veuillez contacter l'administrateur.
        </p>
      </div>
    );
  }

  return (
    <Tabs defaultValue={activeConfigs[0].provider} className="w-full">
      <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${activeConfigs.length}, 1fr)` }}>
        {activeConfigs.map((config) => (
          <TabsTrigger
            key={config.provider}
            value={config.provider}
            className="flex items-center gap-2"
          >
            {getIcon(config.provider)}
            <span className="hidden sm:inline">{getLabel(config.provider)}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
};

export default PaymentMethodTabs;