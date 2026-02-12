import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useSiteConfig, useUpdateConfig } from "@/hooks/useSiteContent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ConfigAdmin() {
  const { data: configs, isLoading } = useSiteConfig();
  const updateConfig = useUpdateConfig();
  const { register, handleSubmit } = useForm();

  const configsByCategory = configs?.reduce((acc: any, config: any) => {
    if (!acc[config.categorie]) {
      acc[config.categorie] = [];
    }
    acc[config.categorie].push(config);
    return acc;
  }, {});

  const onSubmit = (data: any) => {
    Object.keys(data).forEach((cle) => {
      updateConfig.mutate({ cle, valeur: data[cle] });
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Configuration du Site</h1>
        <p className="text-muted-foreground">
          Gérez les paramètres généraux du site web
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="social">Réseaux Sociaux</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          {Object.entries(configsByCategory || {}).map(([categorie, configList]: [string, any]) => (
            <TabsContent key={categorie} value={categorie}>
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">{categorie}</CardTitle>
                  <CardDescription>
                    Paramètres de {categorie}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {configList.map((config: any) => (
                    <div key={config.cle} className="space-y-2">
                      <Label htmlFor={config.cle}>
                        {config.description || config.cle}
                      </Label>
                      <Input
                        id={config.cle}
                        type={config.type === "email" ? "email" : config.type === "url" ? "url" : "text"}
                        defaultValue={config.valeur}
                        {...register(config.cle)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          ))}

          <div className="flex justify-end">
            <Button type="submit" disabled={updateConfig.isPending}>
              {updateConfig.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  );
}
